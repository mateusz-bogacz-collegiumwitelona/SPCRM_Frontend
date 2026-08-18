import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/apiError';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { MainLayout } from '~/components/layout/main-layout';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { formatCurrency } from '~/utils/currency-formatter';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { cn } from '~/utils/utils';
import type { DateRange } from 'react-day-picker';

interface PromotionResponse {
  id: string;
  name: string;
  discountPercentage?: number | null;
  promotionalPrice?: number | null;
  promotionalPriceCode?: string | null;
  promotionalPriceDecimalPlace?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
}

const columnHelper = createColumnHelper<PromotionResponse>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Nazwa promocji',
    cell: (info) => <span className="font-medium text-blue-900">{info.getValue()}</span>,
  }),
  columnHelper.display({
    id: 'discountOrPrice',
    header: 'Rabat / Cena Promo',
    cell: (info) => {
      const row = info.row.original;

      if (row.discountPercentage != null) {
        return (
          <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-semibold">
            -{row.discountPercentage}%
          </span>
        );
      } else if (row.promotionalPrice != null) {
        const formattedPrice = formatCurrency(
          row.promotionalPrice,
          row.promotionalPriceDecimalPlace ?? 2,
        );

        return (
          <span className="font-medium text-green-700">
            {formattedPrice} {row.promotionalPriceCode || 'PLN'}
          </span>
        );
      }

      return <span className="text-gray-400 italic">Brak danych</span>;
    },
  }),
  columnHelper.display({
    id: 'duration',
    header: 'Okres trwania',
    cell: (info) => {
      const { startDate, endDate } = info.row.original;
      const isExpired = endDate && new Date(endDate) < new Date();

      const start = startDate
        ? format(new Date(startDate), 'dd.MM.yyyy', { locale: pl })
        : 'Od zawsze';
      const end = endDate
        ? format(new Date(endDate), 'dd.MM.yyyy', { locale: pl })
        : 'Bezterminowo';

      return (
        <span className={isExpired ? 'text-red-500 font-medium' : 'text-gray-700'}>
          {start} - {end}
        </span>
      );
    },
  }),
  columnHelper.accessor('isActive', {
    header: 'Status',
    cell: (info) => {
      const isActive = info.getValue();
      return (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {isActive ? 'Aktywna' : 'Zakończona'}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: (info) => {
      const row = info.row.original;
      return <a>Szczegóły</a>;
    },
  }),
];

export default function PromotionsList() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('enddate');
  const [sortDescending, setSortDescending] = useState<boolean>(false);

  const [showFilters, setShowFilters] = useState(false);

  const [isActiveFilter, setIsActiveFilter] = useState<string>('true');
  const [date, setDate] = useState<DateRange | undefined>();
  const [discountFrom, setDiscountFrom] = useState<string>('');
  const [discountTo, setDiscountTo] = useState<string>('');
  const [priceFrom, setPriceFrom] = useState<string>('');
  const [priceTo, setPriceTo] = useState<string>('');

  const [isMobile, setIsMobile] = useState(false);

  const [debouncedFilters, setDebouncedFilters] = useState({
    date,
    discountFrom,
    discountTo,
    priceFrom,
    priceTo,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters({ date, discountFrom, discountTo, priceFrom, priceTo });
    }, 500);
    return () => clearTimeout(handler);
  }, [date, discountFrom, discountTo, priceFrom, priceTo]);

  const [accumulatedMobilePromotions, setAccumulatedMobilePromotions] = useState<
    PromotionResponse[]
  >([]);
  const isMobileAppend = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    isMobileAppend.current = false;
    setPageNumber(1);
  }, [debouncedSearch, sortBy, sortDescending, pageSize, isActiveFilter, debouncedFilters]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: [
      'promotions-list',
      {
        pageNumber,
        pageSize,
        debouncedSearch,
        sortBy,
        sortDescending,
        isActiveFilter,
        debouncedFilters,
      },
    ],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
        SortBy: sortBy,
        SortDescending: sortDescending,
        IsActive: isActiveFilter === 'true' ? true : isActiveFilter === 'false' ? false : undefined,

        FromDate: debouncedFilters.date?.from
          ? format(debouncedFilters.date.from, 'yyyy-MM-dd')
          : undefined,
        ToDate: debouncedFilters.date?.to
          ? format(debouncedFilters.date.to, 'yyyy-MM-dd')
          : undefined,
        DiscountPrecentageFrom: debouncedFilters.discountFrom
          ? Number(debouncedFilters.discountFrom)
          : undefined,
        DiscountPrecentageTo: debouncedFilters.discountTo
          ? Number(debouncedFilters.discountTo)
          : undefined,
        PromotionPriceFrom: debouncedFilters.priceFrom
          ? Number(debouncedFilters.priceFrom) * 10000
          : undefined,
        PromotionPriceTo: debouncedFilters.priceTo
          ? Number(debouncedFilters.priceTo) * 10000
          : undefined,
      };

      const response = await api.get(`/promotion`, { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopPromotions = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopPromotions.length;

  useEffect(() => {
    if (!data?.items) return;

    setAccumulatedMobilePromotions((prev) => {
      if (pageNumber === 1) return data.items;

      if (isMobileAppend.current) {
        const newItems = data.items.filter(
          (newItem: PromotionResponse) => !prev.some((p) => p.id === newItem.id),
        );
        return [...prev, ...newItems];
      }

      return data.items;
    });
  }, [data, pageNumber]);

  const handleMobileLoadMore = () => {
    isMobileAppend.current = true;
    setPageNumber((prev) => prev + 1);
  };

  const handleDesktopPageChange = (newPage: number) => {
    isMobileAppend.current = false;
    setPageNumber(newPage);
  };

  const table = useReactTable({
    data: desktopPromotions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const errorMessage = isError
    ? getErrorMessage(
        (queryError as ApiError)?.response?.data?.errorCode,
        'Nie udało się pobrać listy promocji.',
      )
    : null;

  const isAnyFilterActive =
    isActiveFilter !== 'true' ||
    !!date?.from ||
    !!date?.to ||
    !!discountFrom ||
    !!discountTo ||
    !!priceFrom ||
    !!priceTo;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6">
            <h1 className="text-lg lg:text-2xl font-semibold flex items-center gap-2">Promocje</h1>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-full md:w-80 shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Wyszukaj po nazwie promocji/produktu..."
                className="w-full border border-gray-300 rounded-md bg-white px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-gray-500 hidden sm:block">Sortuj po:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                >
                  <option value="enddate">Zakończenia</option>
                  <option value="name">Nazwa</option>
                  <option value="discountpercentage">Wysokość rabatu</option>
                </select>

                <Button
                  variant="outline"
                  onClick={() => setSortDescending(!sortDescending)}
                  className="shrink-0 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 px-3"
                >
                  {sortDescending ? (
                    <ArrowDownWideNarrow className="w-4 h-4" />
                  ) : (
                    <ArrowUpNarrowWide className="w-4 h-4" />
                  )}
                </Button>

                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full sm:w-auto flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filtry</span>
                    {isAnyFilterActive && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-900"></span>
                      </span>
                    )}
                  </Button>

                  {showFilters && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Filtruj promocje</h3>

                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="flex flex-col">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Status promocji
                          </label>
                          <select
                            value={isActiveFilter}
                            onChange={(e) => setIsActiveFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                          >
                            <option value="">Wszystkie</option>
                            <option value="true">Tylko trwające</option>
                            <option value="false">Tylko zakończone</option>
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Okres trwania promocji
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="date"
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal border-gray-300 text-sm py-2 h-auto',
                                  !date && 'text-gray-500',
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                {date?.from ? (
                                  date.to ? (
                                    <span className="truncate">
                                      {format(date.from, 'dd.MM.yyyy')} -{' '}
                                      {format(date.to, 'dd.MM.yyyy')}
                                    </span>
                                  ) : (
                                    <span>{format(date.from, 'dd.MM.yyyy')}</span>
                                  )
                                ) : (
                                  <span>Wybierz zakres dat</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0 z-100 max-h-[85vh] overflow-y-auto max-w-[95vw]"
                              align={isMobile ? 'center' : 'start'}
                            >
                              <Calendar
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={isMobile ? 1 : 2}
                                locale={pl}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Zniżka procentowa (%)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Od"
                              value={discountFrom}
                              onChange={(e) => setDiscountFrom(e.target.value)}
                              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Do"
                              value={discountTo}
                              onChange={(e) => setDiscountTo(e.target.value)}
                              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Cena promocyjna
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              placeholder="Od"
                              value={priceFrom}
                              onChange={(e) => setPriceFrom(e.target.value)}
                              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Do"
                              value={priceTo}
                              onChange={(e) => setPriceTo(e.target.value)}
                              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-4 border-t border-gray-100 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setIsActiveFilter('true');
                            setDate(undefined);
                            setDiscountFrom('');
                            setDiscountTo('');
                            setPriceFrom('');
                            setPriceTo('');
                          }}
                          className="text-xs text-gray-500 hover:text-gray-900 underline"
                        >
                          Zresetuj
                        </button>
                        <Button
                          size="sm"
                          onClick={() => setShowFilters(false)}
                          className="h-8 px-4 bg-blue-900 text-white hover:bg-blue-800 text-xs"
                        >
                          Zamknij
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-center gap-2 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-blue-900 mb-4" />
              <p className="text-gray-500 font-medium">Ładowanie promocji...</p>
            </div>
          ) : desktopPromotions.length === 0 && !isError ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
              <p className="text-gray-500 font-medium">Brak promocji do wyświetlenia.</p>
            </div>
          ) : (
            <>
              <div className="block lg:hidden space-y-4">
                {accumulatedMobilePromotions.map((promo) => {
                  return (
                    <div
                      key={promo.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-blue-900">{promo.name}</p>
                        </div>
                        {promo.isActive ? (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
                            Aktywna
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
                            Zakończona
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
                        <div className="text-gray-700 font-medium">
                          {promo.discountPercentage != null ? (
                            <span className="text-red-600">-{promo.discountPercentage}%</span>
                          ) : promo.promotionalPrice != null ? (
                            `${formatCurrency(promo.promotionalPrice, promo.promotionalPriceDecimalPlace ?? 2)} ${promo.promotionalPriceCode || 'PLN'}`
                          ) : (
                            '-'
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {promo.startDate
                            ? format(new Date(promo.startDate), 'dd.MM.yyyy')
                            : 'Od zawsze'}
                          {' - '}
                          {promo.endDate
                            ? format(new Date(promo.endDate), 'dd.MM.yyyy')
                            : 'Bezterminowo'}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {pageNumber < totalPages && (
                  <div className="mt-6 flex justify-center pt-2">
                    <Button
                      onClick={handleMobileLoadMore}
                      disabled={isFetching}
                      className="w-full bg-blue-900 text-white hover:bg-blue-800 transition-all flex items-center justify-center gap-2 h-11"
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Wczytywanie danych...
                        </>
                      ) : (
                        'Pokaż więcej wyników'
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="hidden lg:block space-y-4">
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="border-b border-gray-200 px-6 py-4 text-left text-sm font-semibold text-gray-900"
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Pozycji na stronie:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:ring-blue-900 text-gray-700 shadow-sm"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="text-sm text-gray-500">
                    Wyświetlanie {Math.min((pageNumber - 1) * pageSize + 1, totalItems)} do{' '}
                    {Math.min(pageNumber * pageSize, totalItems)} z {totalItems} wyników
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleDesktopPageChange(Math.max(pageNumber - 1, 1))}
                      disabled={pageNumber === 1 || isFetching}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-blue-900 border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium text-gray-700 px-2">
                      Strona {pageNumber} z {totalPages}
                    </span>
                    <Button
                      onClick={() => handleDesktopPageChange(Math.min(pageNumber + 1, totalPages))}
                      disabled={pageNumber === totalPages || isFetching}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-blue-900 border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
