import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/api-error';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CalendarIcon,
  Filter,
  Plus,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { MainLayout } from '~/components/layout/main-layout';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { useAuth } from '~/context/auth-context';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { formatCurrency } from '~/utils/data-formatters';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { cn } from '~/utils/utils';
import type { DateRange } from 'react-day-picker';
import { Link, useNavigate } from 'react-router';
import { DataTable } from '~/components/common/data-table';
import { formatDateRangeLabel, mergeById } from '~/utils/table-helpers';
import {
  AddPromotionDialog,
  type AddPromotionRequestPayload,
} from '~/components/promotion/add-promotion-dialog';

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

const parseIsActiveFilter = (filterValue: string): boolean | undefined => {
  if (filterValue === 'true') return true;
  if (filterValue === 'false') return false;
  return undefined;
};

const formatDiscountOrPrice = (promo: PromotionResponse): React.ReactNode => {
  if (typeof promo.discountPercentage === 'number') {
    return <span className="text-red-600">-{promo.discountPercentage}%</span>;
  }
  if (typeof promo.promotionalPrice === 'number') {
    return formatCurrency(
      promo.promotionalPrice,
      promo.promotionalPriceCode || 'PLN',
      promo.promotionalPriceDecimalPlace ?? 2,
    );
  }
  return '-';
};

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

      if (typeof row.discountPercentage === 'number') {
        return (
          <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-semibold">
            -{row.discountPercentage}%
          </span>
        );
      }

      if (typeof row.promotionalPrice === 'number') {
        const currencyCode = row.promotionalPriceCode || 'PLN';
        const decimals = row.promotionalPriceDecimalPlace ?? 2;
        const formattedPrice = formatCurrency(row.promotionalPrice, currencyCode, decimals);

        return <span className="font-medium text-green-700">{formattedPrice}</span>;
      }

      return <span className="text-gray-400 italic">Brak danych</span>;
    },
  }),
  columnHelper.display({
    id: 'duration',
    header: 'Okres trwania',
    cell: (info) => {
      const { startDate, endDate } = info.row.original;
      const isExpired = Boolean(endDate && new Date(endDate) < new Date());

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
    cell: (info) => (
      <Link
        to={`/promotion/${info.row.original.id}`}
        className="font-medium text-blue-900 hover:underline"
      >
        Szczegóły
      </Link>
    ),
  }),
];

const PromotionMobileCard = ({ promo }: { readonly promo: PromotionResponse }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
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
      <div className="text-gray-700 font-medium">{formatDiscountOrPrice(promo)}</div>
      <div className="text-xs text-gray-500">
        {promo.startDate ? format(new Date(promo.startDate), 'dd.MM.yyyy') : 'Od zawsze'}
        {' - '}
        {promo.endDate ? format(new Date(promo.endDate), 'dd.MM.yyyy') : 'Bezterminowo'}
      </div>
    </div>
  </div>
);

export default function PromotionsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManage = user?.roles.some((role) => ['Manager', 'Admin'].includes(role));

  const [isAddOpen, setIsAddOpen] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('endDate');
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
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
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
        IsActive: parseIsActiveFilter(isActiveFilter),
        FromDate: debouncedFilters.date?.from
          ? format(debouncedFilters.date.from, 'yyyy-MM-dd')
          : undefined,
        ToDate: debouncedFilters.date?.to
          ? format(debouncedFilters.date.to, 'yyyy-MM-dd')
          : undefined,
        DiscountPercentageFrom: debouncedFilters.discountFrom
          ? Number(debouncedFilters.discountFrom)
          : undefined,
        DiscountPercentageTo: debouncedFilters.discountTo
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

  const addMutation = useMutation({
    mutationFn: async (payload: AddPromotionRequestPayload) => {
      const res = await api.post('/promotion', payload);
      return res.data?.data;
    },
    onSuccess: async (newPromotionId) => {
      await queryClient.invalidateQueries({ queryKey: ['promotions-list'] });
      setIsAddOpen(false);
      if (newPromotionId) {
        navigate(`/promotion/${newPromotionId}`);
      }
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      alert(
        getErrorMessage(
          apiError.response?.data?.errorCode,
          'Wystąpił błąd podczas tworzenia promocji.',
        ),
      );
    },
  });

  const desktopPromotions = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopPromotions.length;

  useEffect(() => {
    const items: PromotionResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobilePromotions(items);
      return;
    }

    setAccumulatedMobilePromotions((prev) => mergeById(prev, items));
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
    isActiveFilter === 'false' ||
    isActiveFilter === '' ||
    Boolean(date?.from) ||
    Boolean(date?.to) ||
    Boolean(discountFrom) ||
    Boolean(discountTo) ||
    Boolean(priceFrom) ||
    Boolean(priceTo);

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6 flex items-center justify-between">
            <h1 className="text-lg lg:text-2xl font-semibold flex items-center gap-2">Promocje</h1>
            {canManage && (
              <Button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="bg-white text-blue-900 hover:bg-gray-100 flex items-center gap-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                Dodaj promocję
              </Button>
            )}
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
                  <option value="endDate">Zakończenia</option>
                  <option value="name">Nazwa</option>
                  <option value="discountpercentage">Wysokość rabatu</option>
                </select>

                <Button
                  type="button"
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
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full sm:w-auto flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filtry</span>
                    {isAnyFilterActive && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-900" />
                      </span>
                    )}
                  </Button>

                  {showFilters && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Filtruj promocje</h3>

                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="flex flex-col">
                          <label
                            htmlFor="promo-status-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Status promocji
                          </label>
                          <select
                            id="promo-status-filter"
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
                          <label
                            htmlFor="promo-date-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Okres trwania promocji
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="promo-date-filter"
                                type="button"
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal border-gray-300 text-sm py-2 h-auto',
                                  !date && 'text-gray-500',
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                {formatDateRangeLabel(date)}
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
                          <label
                            htmlFor="discount-from"
                            className="block text-xs font-medium text-gray-700 mb-2"
                          >
                            Zniżka procentowa (%)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              id="discount-from"
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
                              id="discount-to"
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
                          <label
                            htmlFor="price-from"
                            className="block text-xs font-medium text-gray-700 mb-2"
                          >
                            Cena promocyjna
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              id="price-from"
                              type="number"
                              min="0"
                              placeholder="Od"
                              value={priceFrom}
                              onChange={(e) => setPriceFrom(e.target.value)}
                              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              id="price-to"
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
                          type="button"
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

          <DataTable
            table={table}
            isLoading={isLoading}
            isError={isError}
            data={accumulatedMobilePromotions}
            pageNumber={pageNumber}
            totalPages={totalPages}
            isFetching={isFetching}
            onMobileLoadMore={handleMobileLoadMore}
            mobileCardKeyExtractor={(promo) => promo.id}
            renderMobileCard={(promo) => <PromotionMobileCard promo={promo} />}
            emptyMessage="Brak promocji do wyświetlenia."
            loadingMessage="Ładowanie promocji..."
            paginationProps={{
              pageNumber,
              pageSize,
              totalPages,
              totalItems,
              isFetching,
              onPageSizeChange: setPageSize,
              onPageChange: handleDesktopPageChange,
            }}
          />

          <AddPromotionDialog
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            onSave={async (payload) => {
              await addMutation.mutateAsync(payload);
            }}
            isLoading={addMutation.isPending}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
