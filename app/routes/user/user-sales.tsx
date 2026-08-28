import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CalendarIcon,
  Filter,
} from 'lucide-react';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/api-error';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { MainLayout } from '~/components/layout/main-layout';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { cn } from '~/utils/utils';
import type { DateRange } from 'react-day-picker';
import { formatCurrency } from '~/utils/data-formatters';
import { Link } from 'react-router';
import { getStatusConfig } from '~/utils/sale-status';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { DataTable } from '~/components/common/data-table';
import { formatDateRangeLabel, mergeById } from '~/utils/table-helpers';

interface UserSalesResponse {
  id: string;
  name: string;
  nip: string;
  status: string;
  closeDate: string;
  value: number;
  decimalPlace: number;
  currency: string;
  companyName: string;
}

const formatDate = (isoDate: string) => {
  return new Date(isoDate).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const columnHelper = createColumnHelper<UserSalesResponse>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Nazwa',
    cell: (info) => <span className="font-medium text-blue-900">{info.getValue()}</span>,
  }),
  columnHelper.accessor('companyName', {
    header: 'Firma',
  }),
  columnHelper.accessor('nip', {
    header: 'NIP',
    cell: (info) => <span className="text-gray-500">{info.getValue()}</span>,
  }),
  columnHelper.accessor('value', {
    header: 'Kwota',
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="font-medium text-gray-900">
          {formatCurrency(row.value, row.currency, row.decimalPlace)}
        </span>
      );
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = getStatusConfig(info.getValue());
      return (
        <span
          className={`inline-flex items-center rounded-full ${status.bgColor} px-3 py-1 text-xs font-medium ${status.textColor}`}
        >
          {status.label}
        </span>
      );
    },
  }),
  columnHelper.accessor('closeDate', {
    header: 'Zakończenie',
    cell: (info) => <span className="text-gray-500">{formatDate(info.getValue())}</span>,
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: (info) => (
      <Link
        to={`/sale/${info.row.original.id}`}
        className="font-medium text-blue-900 hover:underline"
      >
        Szczegóły
      </Link>
    ),
  }),
];

interface SaleMobileCardProps {
  readonly item: UserSalesResponse;
}

const SaleMobileCard = ({ item }: SaleMobileCardProps) => {
  const status = getStatusConfig(item.status);
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-blue-900 truncate">{item.companyName}</p>
          <p className="text-xs text-gray-500 mb-1">NIP: {item.nip}</p>
          <p className="text-sm font-medium text-gray-700">
            {formatCurrency(item.value, item.currency, item.decimalPlace)}
          </p>
        </div>
        <span
          className={`flex shrink-0 items-center justify-center rounded-full ${status.bgColor} px-3 py-1 text-xs font-medium ${status.textColor}`}
        >
          {status.label}
        </span>
      </div>
      <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
        <p className="text-xs text-gray-500">Zakończenie: {formatDate(item.closeDate)}</p>
        <p className="text-xs font-medium text-gray-900 truncate max-w-30">{item.name}</p>
        <Link to={`/sale/${item.id}`} className="text-sm font-medium text-blue-900 hover:underline">
          Szczegóły
        </Link>
      </div>
    </div>
  );
};

export default function UserSales() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDescending, setSortDescending] = useState<boolean>(true);
  const [date, setDate] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [accumulatedMobileSales, setAccumulatedMobileSales] = useState<UserSalesResponse[]>([]);

  const [isMobile, setIsMobile] = useState(false);
  const isMobileAppend = useRef(false);

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
  }, [debouncedSearch, sortBy, sortDescending, pageSize, date, statusFilter]);

  const { data: statusesResponse } = useQuery({
    queryKey: ['sales-statuses'],
    queryFn: async () => {
      const response = await api.get('/sales/statuses');
      return response.data?.value || response.data?.data || response.data || [];
    },
  });

  const availableStatuses: string[] = Array.isArray(statusesResponse) ? statusesResponse : [];

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: [
      'sales',
      { pageNumber, pageSize, debouncedSearch, sortBy, sortDescending, date, statusFilter },
    ],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
        SortBy: sortBy,
        SortDescending: sortDescending,
        DateFrom: date?.from ? format(date.from, 'yyyy-MM-dd') : undefined,
        DateTo: date?.to ? format(date.to, 'yyyy-MM-dd') : undefined,
        StatusType: statusFilter || undefined,
      };
      const response = await api.get('/sales', { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopSales = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopSales.length;

  useEffect(() => {
    const items: UserSalesResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileSales(items);
      return;
    }

    setAccumulatedMobileSales((prev) => mergeById(prev, items));
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
    data: desktopSales,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const errorMessage = isError
    ? getErrorMessage(
        (queryError as ApiError)?.response?.data?.errorCode,
        'Nie udało się pobrać listy sprzedaży.',
      )
    : null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6">
            <h1 className="text-lg lg:text-2xl font-semibold">Sprzedaż</h1>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-full md:w-80 shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Wyszukaj (Nazwa, Firma, NIP)..."
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
                  <option value="date">Data zawarcia</option>
                  <option value="company">Firma</option>
                  <option value="value">Kwota</option>
                  <option value="name">Nazwa</option>
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
                    {(date?.from || date?.to || statusFilter) && (
                      <span className="-top-1 -right-1 flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-900" />
                      </span>
                    )}
                  </Button>

                  {showFilters && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Filtruj sprzedaż</h3>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <label
                            htmlFor="sales-date-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Zakres dat
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="sales-date-filter"
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

                        <div className="flex flex-col">
                          <label
                            htmlFor="sales-status-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Status sprzedaży
                          </label>
                          <select
                            id="sales-status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                          >
                            <option value="">Wszystkie</option>
                            {availableStatuses.map((status) => {
                              const config = getStatusConfig(status);
                              return (
                                <option key={status} value={status}>
                                  {config.label}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="pt-3 mt-4 border-t border-gray-100 flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setDate(undefined);
                              setStatusFilter('');
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
            data={accumulatedMobileSales}
            pageNumber={pageNumber}
            totalPages={totalPages}
            isFetching={isFetching}
            onMobileLoadMore={handleMobileLoadMore}
            mobileCardKeyExtractor={(item) => item.id}
            renderMobileCard={(item) => <SaleMobileCard item={item} />}
            emptyMessage="Brak wyników do wyświetlenia."
            loadingMessage="Wczytywanie sprzedaży..."
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
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
