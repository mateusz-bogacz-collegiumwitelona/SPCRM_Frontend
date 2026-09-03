import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CalendarIcon,
  Filter,
  Plus,
  X,
} from 'lucide-react';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { MainLayout } from '~/components/layout/main-layout';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { cn } from '~/utils/utils';
import type { DateRange } from 'react-day-picker';
import { Link } from 'react-router';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { DataTable } from '~/components/common/data-table';
import { formatDateRangeLabel, mergeById } from '~/utils/table-helpers';
import {
  AddCompanyDialog,
  type AddCompanyRequest,
} from '~/components/companies/add-company-dialog';

interface GetCompanyResponse {
  id: string;
  name: string;
  nip: string;
  lastDealDate?: string | null;
  isYour: boolean;
  ownerFistName?: string | null;
  ownerLastName?: string | null;
  city: string;
  street: string;
  zipCode: string;
  createdAt: string;
}

const formatDate = (isoDate: string) => {
  return new Date(isoDate).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const parseIsYourFilter = (filterValue: string): boolean | undefined => {
  if (filterValue === 'true') return true;
  if (filterValue === 'false') return false;
  return undefined;
};

const columnHelper = createColumnHelper<GetCompanyResponse>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Nazwa firmy',
    cell: (info) => <span className="font-medium text-blue-900">{info.getValue()}</span>,
  }),
  columnHelper.accessor('nip', {
    header: 'NIP',
    cell: (info) => <span className="text-gray-500">{info.getValue()}</span>,
  }),
  columnHelper.accessor('isYour', {
    header: 'Opiekun',
    cell: (info) => {
      const row = info.row.original;
      if (row.isYour) {
        return <span className="text-green-500 font-medium">Twój klient</span>;
      }
      return (
        <span className="text-gray-500">
          Opiekun: {row.ownerFistName} {row.ownerLastName}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: 'address',
    header: 'Adres',
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="text-gray-500">
          {row.street}, {row.zipCode} {row.city}
        </span>
      );
    },
  }),
  columnHelper.accessor('lastDealDate', {
    header: 'Data ostatniej transakcji',
    cell: (info) => {
      const row = info.row.original;
      if (row.lastDealDate) {
        return <span className="text-gray-500">{formatDate(row.lastDealDate)}</span>;
      }
      return <span className="text-gray-400 italic">Brak danych</span>;
    },
  }),
  columnHelper.accessor('createdAt', {
    header: 'Data dodania',
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="text-gray-500">
          {format(new Date(row.createdAt), 'dd.MM.yyyy', { locale: pl })}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: (info) => (
      <Link
        to={`/company/${info.row.original.id}`}
        className="font-medium text-blue-900 hover:underline"
      >
        Szczegóły
      </Link>
    ),
  }),
];

const CompanyMobileCard = ({ item }: { readonly item: GetCompanyResponse }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-start justify-between gap-2">
      <div className="overflow-hidden">
        <p className="text-sm font-bold text-blue-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-500 mb-1">NIP: {item.nip}</p>
        <p className="text-sm text-gray-700">
          {item.city}, {item.street}
        </p>
      </div>
      {item.isYour && (
        <span className="flex shrink-0 items-center justify-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          Twój
        </span>
      )}
    </div>
    <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
      <p className="text-xs text-gray-500">
        Z transakcją: {item.lastDealDate ? formatDate(item.lastDealDate) : 'Brak'}
      </p>
      <Link
        to={`/company/${item.id}`}
        className="text-xs font-medium text-blue-900 hover:underline"
      >
        Szczegóły
      </Link>
    </div>
  </div>
);

export default function Companies() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDescending, setSortDescending] = useState<boolean>(true);
  const [date, setDate] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [isYourFilter, setIsYourFilter] = useState<string>('');

  const [accumulatedMobileCompanies, setAccumulatedMobileCompanies] = useState<
    GetCompanyResponse[]
  >([]);

  const [isMobile, setIsMobile] = useState(false);
  const isMobileAppend = useRef(false);

  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    isMobileAppend.current = false;
    setPageNumber(1);
  }, [debouncedSearch, sortBy, sortDescending, pageSize, date, isYourFilter]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: [
      'companies',
      {
        pageNumber,
        pageSize,
        debouncedSearch,
        sortBy,
        sortDescending,
        date,
        isYourFilter,
      },
    ],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
        SortBy: sortBy,
        SortDescending: sortDescending,
        CreatedAtFrom: date?.from ? format(date.from, 'yyyy-MM-dd') : undefined,
        CreatedAtTo: date?.to ? format(date.to, 'yyyy-MM-dd') : undefined,
        IsYour: parseIsYourFilter(isYourFilter),
      };
      const response = await api.get('/company/list', { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopCompanies = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopCompanies.length;

  useEffect(() => {
    const items: GetCompanyResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileCompanies(items);
      return;
    }

    setAccumulatedMobileCompanies((prev) => mergeById(prev, items));
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
    data: desktopCompanies,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  const listError: FormErrorState | null =
    isError && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message || activeError?.message || 'Nie udało się pobrać listy firm.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  const addCompanyMutation = useMutation({
    mutationFn: async (payload: AddCompanyRequest) => {
      const response = await api.post('/company', payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsAddCompanyOpen(false);
    },
  });

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6 flex justify-between items-center">
            <h1 className="text-lg lg:text-2xl font-semibold">Baza firm</h1>
            <Button
              type="button"
              onClick={() => setIsAddCompanyOpen(true)}
              className="bg-white text-blue-900 hover:bg-blue-50 font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj firmę</span>
            </Button>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-full md:w-80 shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Wyszukaj (Nazwa, NIP, Miasto)..."
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
                  <option value="name">Nazwa</option>
                  <option value="nip">NIP</option>
                  <option value="city">Miasto</option>
                  <option value="zipcode">Kod pocztowy</option>
                  <option value="createdat">Data dodania</option>
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
                    {(date?.from || date?.to || isYourFilter) && (
                      <span className="-top-1 -right-1 flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-900" />
                      </span>
                    )}
                  </Button>

                  {showFilters && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Filtruj firmy</h3>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <label
                            htmlFor="client-type-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Typ klienta
                          </label>
                          <select
                            id="client-type-filter"
                            value={isYourFilter}
                            onChange={(e) => setIsYourFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                          >
                            <option value="">Wszyscy klienci</option>
                            <option value="true">Tylko moi klienci</option>
                            <option value="false">Klienci innych</option>
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label
                            htmlFor="company-date-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Data dodania firmy
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="company-date-filter"
                                type="button"
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal border-gray-300',
                                  !date && 'text-gray-500',
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
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

                        <div className="pt-3 mt-4 border-t border-gray-100 flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setDate(undefined);
                              setIsYourFilter('');
                            }}
                            className="text-xs text-gray-500 hover:text-gray-900 underline"
                          >
                            Wyczyść
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {listError && (
            <div className="mb-6 relative flex items-start gap-2.5 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 pr-4">
                <p className="font-medium leading-tight">{listError.title}</p>
                {listError.details && listError.details.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                    {listError.details.map((detailErr, idx) => (
                      <li key={idx}>{detailErr}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsErrorDismissed(true)}
                className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                title="Zamknij"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <DataTable
            table={table}
            isLoading={isLoading}
            isError={isError}
            data={accumulatedMobileCompanies}
            pageNumber={pageNumber}
            totalPages={totalPages}
            isFetching={isFetching}
            onMobileLoadMore={handleMobileLoadMore}
            mobileCardKeyExtractor={(item) => item.id}
            renderMobileCard={(item) => <CompanyMobileCard item={item} />}
            emptyMessage="Brak wyników do wyświetlenia."
            loadingMessage="Wczytywanie firm..."
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

          <AddCompanyDialog
            isOpen={isAddCompanyOpen}
            onClose={() => setIsAddCompanyOpen(false)}
            onSave={async (data) => {
              await addCompanyMutation.mutateAsync(data);
            }}
            isLoading={addCompanyMutation.isPending}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
