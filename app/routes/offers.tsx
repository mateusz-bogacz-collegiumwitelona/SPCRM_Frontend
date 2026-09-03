import {createColumnHelper, getCoreRowModel, useReactTable} from '@tanstack/react-table';
import {Link} from 'react-router';
import {useEffect, useMemo, useRef, useState} from 'react';
import {keepPreviousData, useQuery} from '@tanstack/react-query';
import {api} from '~/api/api';
import {getErrorMessage} from '~/utils/error-mapper';
import type ApiError, {FormErrorState} from '~/interfaces/api-error';
import {AlertCircle, ArrowDownWideNarrow, ArrowUpNarrowWide, CalendarIcon, Filter, Plus, X,} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {MainLayout} from '~/components/layout/main-layout';
import {RoleGuard} from '~/lib/role-guard';
import {AuthGuard} from '~/lib/auth-guard';
import {DataTable} from '~/components/common/data-table';
import {formatDateRangeLabel} from '~/utils/table-helpers';
import {format} from 'date-fns';
import {pl} from 'date-fns/locale';
import {Calendar} from '~/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '~/components/ui/popover';
import {cn} from '~/utils/utils';
import type {DateRange} from 'react-day-picker';
import {formatOfferStatusLabel, getStatusBadge} from '~/utils/offer-status-helper';

interface OfferListResponse {
  offerId: string;
  offerName: string;
  contactFirstName: string;
  contactLastName: string;
  companyName: string;
  validUntil: string;
  status: string;
  isExpired: boolean;
}

interface CompanySimpleListResponse {
  id: string;
  name: string;
}

const columnHelper = createColumnHelper<OfferListResponse>();

const columns = [
  columnHelper.accessor('offerName', {
    header: 'Numer oferty',
    cell: (info) => <span className="font-semibold text-blue-900">{info.getValue()}</span>,
  }),
  columnHelper.accessor('companyName', {
    header: 'Firma',
    cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
  }),
  columnHelper.display({
    id: 'contactFullName',
    header: 'Osoba kontaktowa',
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="text-sm text-gray-600">
          {row.contactFirstName} {row.contactLastName}
        </span>
      );
    },
  }),
  columnHelper.accessor('validUntil', {
    header: 'Ważna do',
    cell: (info) => {
      const dateStr = info.getValue();
      if (!dateStr) return '-';
      return (
        <span className="text-sm text-gray-600">
          {format(new Date(dateStr), 'dd MMM yyyy', { locale: pl })}
        </span>
      );
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const row = info.row.original;
      return getStatusBadge(row.status, row.isExpired);
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: (info) => (
      <Link
        to={`/offer/${info.row.original.offerId}`}
        className="font-medium text-blue-900 hover:underline"
      >
        Szczegóły
      </Link>
    ),
  }),
];

const OfferMobileCard = ({ offer }: { readonly offer: OfferListResponse }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-2 flex justify-between items-start">
      <div>
        <p className="text-sm font-bold text-blue-900">{offer.offerName}</p>
        <p className="text-xs font-medium text-gray-900 mt-0.5">{offer.companyName}</p>
        <p className="text-xs text-gray-500">
          {offer.contactFirstName} {offer.contactLastName}
        </p>
      </div>
      <div>{getStatusBadge(offer.status, offer.isExpired)}</div>
    </div>
    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
      <div className="text-xs text-gray-500">
        Ważna do:{' '}
        {offer.validUntil ? format(new Date(offer.validUntil), 'dd.MM.yyyy', { locale: pl }) : '-'}
      </div>
      <Link
        to={`/offers/${offer.offerId}`}
        className="text-xs font-medium text-blue-900 hover:underline"
      >
        Szczegóły
      </Link>
    </div>
  </div>
);

export default function OffersList() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('validuntil');
  const [sortDescending, setSortDescending] = useState<boolean>(false);

  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [companyNameFilter, setCompanyNameFilter] = useState<string>('');
  const [isExpiredFilter, setIsExpiredFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [isMobile, setIsMobile] = useState(false);
  const [accumulatedMobileOffers, setAccumulatedMobileOffers] = useState<OfferListResponse[]>([]);
  const isMobileAppend = useRef(false);

  const { data: statusDictionary } = useQuery<string[]>({
    queryKey: ['offer-statuses-dictionary'],
    queryFn: async () => {
      const res = await api.get('/offer/statuses');
      return res.data?.data || res.data?.value || res.data || [];
    },
  });

  const statuses = statusDictionary || ['Sent', 'Accepted', 'Rejected', 'Expired'];

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
  }, [
    debouncedSearch,
    sortBy,
    sortDescending,
    pageSize,
    statusFilter,
    companyNameFilter,
    isExpiredFilter,
    dateRange,
  ]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: [
      'offers-list',
      {
        pageNumber,
        pageSize,
        debouncedSearch,
        sortBy,
        sortDescending,
        statusFilter,
        companyNameFilter,
        isExpiredFilter,
        dateRange,
      },
    ],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
        SortBy: sortBy,
        SortDescending: sortDescending,
        Status: statusFilter || undefined,
        CompanyName: companyNameFilter || undefined,
        IsExpired: isExpiredFilter !== '' ? isExpiredFilter === 'true' : undefined,
        ValidUntilFrom: dateRange?.from
          ? new Date(
              Date.UTC(
                dateRange.from.getFullYear(),
                dateRange.from.getMonth(),
                dateRange.from.getDate(),
              ),
            ).toISOString()
          : undefined,
        ValidUntilTo: dateRange?.to
          ? new Date(
              Date.UTC(
                dateRange.to.getFullYear(),
                dateRange.to.getMonth(),
                dateRange.to.getDate(),
                23,
                59,
                59,
                999,
              ),
            ).toISOString()
          : undefined,
      };

      const response = await api.get('/offer', { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopOffers = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopOffers.length;

  useEffect(() => {
    const items: OfferListResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileOffers(items);
      return;
    }

    setAccumulatedMobileOffers((prev) => {
      const existingIds = new Set(prev.map((offer) => offer.offerId));
      const newItems = items.filter((offer) => !existingIds.has(offer.offerId));
      return [...prev, ...newItems];
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

  const { data: companieSimpleList } = useQuery<CompanySimpleListResponse[]>({
    queryKey: ['companies-simple-list'],
    queryFn: async () => {
      const response = await api.get('/company/simple-list');
      return response.data?.value || response.data?.data || response.data;
    },
  });

  const availableCompanies = Array.isArray(companieSimpleList) ? companieSimpleList : [];

  const table = useReactTable({
    data: desktopOffers,
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
            responseData?.message || activeError?.message || 'Nie udało się pobrać listy ofert.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  const isAnyFilterActive =
    statusFilter !== '' ||
    companyNameFilter !== '' ||
    isExpiredFilter !== '' ||
    Boolean(dateRange?.from) ||
    Boolean(dateRange?.to);

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager', 'Admin']} redirectTo="/dashboard">
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6 flex justify-between items-center">
            <h1 className="text-lg lg:text-2xl font-semibold flex items-center gap-2">Oferty</h1>
            <Button
              asChild
              className="bg-white text-blue-900 hover:bg-gray-100 font-medium text-xs sm:text-sm flex items-center gap-2"
            >
              <Link to="/mailing">
                <Plus className="w-4 h-4" /> Nowa oferta (Mailing)
              </Link>
            </Button>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-full md:w-80 shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Wyszukaj ofertę..."
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
                  <option value="validuntil">Ważna do</option>
                  <option value="companyname">Firma</option>
                  <option value="status">Status</option>
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
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Filtruj oferty</h3>

                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="flex flex-col">
                          <label
                            htmlFor="offer-status-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Status oferty
                          </label>
                          <select
                            id="offer-status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                          >
                            <option value="">Wszystkie statusy</option>
                            {statuses.map((status) => (
                              <option key={status} value={status}>
                                {formatOfferStatusLabel(status)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label
                            htmlFor="offer-expired-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Okres ważności
                          </label>
                          <select
                            id="offer-expired-filter"
                            value={isExpiredFilter}
                            onChange={(e) => setIsExpiredFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                          >
                            <option value="">Wszystkie</option>
                            <option value="false">Tylko aktywne</option>
                            <option value="true">Tylko wygasłe</option>
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label
                            htmlFor="offer-company-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Nazwa firmy
                          </label>
                          <select
                            value={companyNameFilter}
                            onChange={(e) => setCompanyNameFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                          >
                            <option value="">Wszystkie firmy</option>
                            {availableCompanies.map((comp) => (
                              <option key={comp.id} value={comp.name}>
                                {comp.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label
                            htmlFor="offer-date-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Data ważności
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="offer-date-filter"
                                type="button"
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal border-gray-300 text-sm py-2 h-auto',
                                  !dateRange && 'text-gray-500',
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                {formatDateRangeLabel(dateRange)}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0 z-100 max-h-[85vh] overflow-y-auto max-w-[95vw]"
                              align={isMobile ? 'center' : 'start'}
                            >
                              <Calendar
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={isMobile ? 1 : 2}
                                locale={pl}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="pt-3 mt-4 border-t border-gray-100 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter('');
                            setCompanyNameFilter('');
                            setIsExpiredFilter('');
                            setDateRange(undefined);
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
            data={accumulatedMobileOffers}
            pageNumber={pageNumber}
            totalPages={totalPages}
            isFetching={isFetching}
            onMobileLoadMore={handleMobileLoadMore}
            mobileCardKeyExtractor={(offer) => offer.offerId}
            renderMobileCard={(offer) => <OfferMobileCard offer={offer} />}
            emptyMessage="Brak ofert do wyświetlenia."
            loadingMessage="Ładowanie ofert..."
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
