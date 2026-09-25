import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CalendarIcon,
  Download,
  Filter,
  X,
} from 'lucide-react';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
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

import { formatDateRangeLabel, mergeById } from '~/utils/table-helpers';
import { formatCurrency } from '~/utils/data-formatters';
import { DataTable } from '~/components/table/data-table';
import { DownloadInvoicePdfDialog } from '~/components/invoice/dialogs/download-invoice-pdf-dialog';
import type { InvoiceListResponse } from '~/interfaces/invoice';
import { STANDARD_ROLES } from '~/constants/roles';

interface InvoiceTableMeta {
  onDownloadPdf: (invoice: { id: string; invoiceNumber: string }) => void;
}

const parseIsOverDueFilter = (filterValue: string): boolean | undefined => {
  if (filterValue === 'true') return true;
  if (filterValue === 'false') return false;
  return undefined;
};

const renderInvoiceStatusBadge = (item: InvoiceListResponse) => {
  if (item.remainingAmount <= 0) {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
        Opłacona
      </span>
    );
  }
  if (item.isOverDue) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
        Zaległa
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
      W toku
    </span>
  );
};

const columnHelper = createColumnHelper<InvoiceListResponse>();

const columns = [
  columnHelper.accessor('invoiceNumber', {
    header: 'Numer faktury',
    cell: (info) => (
      <Link
        to={`/invoice/${info.row.original.id}`}
        className="font-semibold text-blue-900 hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.display({
    id: 'company',
    header: 'Kontrahent',
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.companyName}</span>
          <span className="text-xs text-gray-500">NIP: {row.companyNip}</span>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: 'amounts',
    header: 'Wartość brutto / Pozostało',
    cell: (info) => {
      const row = info.row.original;
      const total = formatCurrency(row.totalAmount, row.currencyCode, row.decimalPlaces);
      const remaining = formatCurrency(row.remainingAmount, row.currencyCode, row.decimalPlaces);

      return (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{total}</span>
          <span
            className={cn(
              'text-xs',
              row.remainingAmount > 0 ? 'text-amber-600 font-semibold' : 'text-gray-500',
            )}
          >
            Pozostało: {remaining}
          </span>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: 'dates',
    header: 'Wystawiono / Termin',
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex flex-col text-xs text-gray-600">
          <span>Wystawiona: {format(new Date(row.issueDate), 'dd.MM.yyyy', { locale: pl })}</span>
          <span className={cn(row.isOverDue && 'text-red-600 font-bold')}>
            Termin: {format(new Date(row.dueDate), 'dd.MM.yyyy', { locale: pl })}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor('isOverDue', {
    header: 'Status',
    cell: (info) => {
      const row = info.row.original;
      if (row.remainingAmount <= 0) {
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">
            Opłacona
          </span>
        );
      }
      if (row.isOverDue) {
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">
            Przeterminowana
          </span>
        );
      }
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
          Do zapłaty
        </span>
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: (info) => {
      const meta = info.table.options.meta as InvoiceTableMeta;
      return (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              meta?.onDownloadPdf({
                id: info.row.original.id,
                invoiceNumber: info.row.original.invoiceNumber,
              })
            }
            className="p-1 rounded text-gray-500 hover:text-blue-900 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Pobierz PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          <Link
            to={`/invoice/${info.row.original.id}`}
            className="font-medium text-blue-900 hover:underline text-xs"
          >
            Szczegóły
          </Link>
        </div>
      );
    },
  }),
];

interface InvoiceMobileCardProps {
  readonly item: InvoiceListResponse;
  readonly onDownloadPdf: (invoice: { id: string; invoiceNumber: string }) => void;
}

const InvoiceMobileCard = ({ item, onDownloadPdf }: InvoiceMobileCardProps) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-2 flex items-start justify-between gap-2">
      <div className="overflow-hidden">
        <Link
          to={`/invoice/${item.id}`}
          className="text-sm font-bold text-blue-900 truncate hover:underline block"
        >
          {item.invoiceNumber}
        </Link>
        <p className="text-xs font-medium text-gray-900 mt-0.5">{item.companyName}</p>
        <p className="text-xs text-gray-500">NIP: {item.companyNip}</p>
      </div>
      <div>{renderInvoiceStatusBadge(item)}</div>
    </div>

    <div className="text-xs text-gray-600 border-t border-gray-100 pt-2 mt-2 flex justify-between items-center">
      <span>
        Kwota:{' '}
        <strong className="text-gray-900">
          {formatCurrency(item.totalAmount, item.currencyCode, item.decimalPlaces)}
        </strong>
      </span>
      <span className={item.remainingAmount > 0 ? 'text-amber-700 font-semibold' : 'text-gray-500'}>
        Do spłaty: {formatCurrency(item.remainingAmount, item.currencyCode, item.decimalPlaces)}
      </span>
    </div>

    <div className="border-t border-gray-100 pt-3 mt-2 flex items-center justify-between">
      <span
        className={cn('text-[11px]', item.isOverDue ? 'text-red-600 font-bold' : 'text-gray-500')}
      >
        Termin: {format(new Date(item.dueDate), 'dd.MM.yyyy')}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onDownloadPdf({ id: item.id, invoiceNumber: item.invoiceNumber })}
          className="text-xs font-medium text-gray-600 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          PDF
        </button>
        <Link
          to={`/invoice/${item.id}`}
          className="text-xs font-medium text-blue-900 hover:underline"
        >
          Szczegóły
        </Link>
      </div>
    </div>
  </div>
);

export default function InvoicesList() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [sortBy, setSortBy] = useState<string>('issuedate');
  const [sortDescending, setSortDescending] = useState<boolean>(true);

  const [date, setDate] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [isOverDueFilter, setIsOverDueFilter] = useState<string>('');
  const [companyNameFilter, setCompanyNameFilter] = useState<string>('');
  const [companyNipFilter, setCompanyNipFilter] = useState<string>('');
  const [amountFrom, setAmountFrom] = useState<string>('');
  const [amountTo, setAmountTo] = useState<string>('');

  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<{
    id: string;
    invoiceNumber: string;
  } | null>(null);

  const [accumulatedMobileInvoices, setAccumulatedMobileInvoices] = useState<InvoiceListResponse[]>(
    [],
  );
  const [isMobile, setIsMobile] = useState(false);
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
  }, [
    debouncedSearch,
    sortBy,
    sortDescending,
    pageSize,
    date,
    isOverDueFilter,
    companyNameFilter,
    companyNipFilter,
    amountFrom,
    amountTo,
  ]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: [
      'invoices-list',
      {
        pageNumber,
        pageSize,
        debouncedSearch,
        sortBy,
        sortDescending,
        date,
        isOverDueFilter,
        companyNameFilter,
        companyNipFilter,
        amountFrom,
        amountTo,
      },
    ],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
        SortBy: sortBy,
        SortDescending: sortDescending,
        CompanyName: companyNameFilter.trim() || undefined,
        CompanyNip: companyNipFilter.trim() || undefined,
        IssueDateFrom: date?.from
          ? new Date(
              Date.UTC(date.from.getFullYear(), date.from.getMonth(), date.from.getDate(), 0, 0, 0),
            ).toISOString()
          : undefined,
        IssueDateTo: date?.to
          ? new Date(
              Date.UTC(
                date.to.getFullYear(),
                date.to.getMonth(),
                date.to.getDate(),
                23,
                59,
                59,
                999,
              ),
            ).toISOString()
          : undefined,
        IsOverDue: parseIsOverDueFilter(isOverDueFilter),
        TotalAmountFrom: amountFrom ? Number(amountFrom) * 10000 : undefined,
        TotalAmountTo: amountTo ? Number(amountTo) * 10000 : undefined,
      };

      const response = await api.get('/invoice', { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopInvoices = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopInvoices.length;

  useEffect(() => {
    const items: InvoiceListResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileInvoices(items);
      return;
    }

    setAccumulatedMobileInvoices((prev) => mergeById(prev, items));
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
    data: desktopInvoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onDownloadPdf: (inv) => setSelectedInvoiceForPdf(inv),
    } satisfies InvoiceTableMeta,
  });

  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  let errorDetails: string[] | undefined;
  if (responseData?.errors && responseData.errors.length > 0) {
    errorDetails = responseData.errors;
  }

  const listError: FormErrorState | null =
    isError && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message || activeError?.message || 'Nie udało się pobrać listy faktur.',
          ),
          details: errorDetails,
        }
      : null;

  const isAnyFilterActive =
    Boolean(date?.from) ||
    Boolean(date?.to) ||
    isOverDueFilter !== '' ||
    companyNameFilter !== '' ||
    companyNipFilter !== '' ||
    Boolean(amountFrom) ||
    Boolean(amountTo);

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={STANDARD_ROLES}>
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6 flex justify-between items-center">
            <h1 className="text-lg lg:text-2xl font-semibold">Faktury</h1>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-full md:w-80 shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Wyszukaj po nr faktury, firmie, NIP, walucie..."
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
                  <option value="issuedate">Data wystawienia</option>
                  <option value="duedate">Termin płatności</option>
                  <option value="totalamount">Kwota brutto</option>
                </select>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSortDescending(!sortDescending)}
                  className="shrink-0 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 px-3 cursor-pointer"
                  title={sortDescending ? 'Sortowanie malejąco' : 'Sortowanie rosnąco'}
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
                    className="w-full sm:w-auto flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filtry</span>
                    {isAnyFilterActive && (
                      <span className="-top-1 -right-1 flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-900" />
                      </span>
                    )}
                  </Button>

                  {showFilters && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 max-h-[75vh] overflow-y-auto">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Filtruj faktury</h3>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <label
                            htmlFor="overdue-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Status płatności
                          </label>
                          <select
                            id="overdue-filter"
                            value={isOverDueFilter}
                            onChange={(e) => setIsOverDueFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                          >
                            <option value="">Wszystkie</option>
                            <option value="true">Tylko przeterminowane</option>
                            <option value="false">W terminie / opłacone</option>
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label
                            htmlFor="invoice-date-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Data wystawienia
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="invoice-date-filter"
                                type="button"
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal border-gray-300 text-xs py-2',
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
                            htmlFor="company-name-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Firma (dokładna nazwa)
                          </label>
                          <input
                            id="company-name-filter"
                            type="text"
                            placeholder="np. Stal-Met"
                            value={companyNameFilter}
                            onChange={(e) => setCompanyNameFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label
                            htmlFor="company-nip-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            NIP kontrahenta
                          </label>
                          <input
                            id="company-nip-filter"
                            type="text"
                            placeholder="np. 1234567890"
                            value={companyNipFilter}
                            onChange={(e) => setCompanyNipFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                          />
                        </div>

                        <div>
                          <span className="block text-xs font-medium text-gray-700 mb-1">
                            Wartość brutto (od - do)
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              id="amount-from"
                              type="number"
                              min="0"
                              placeholder="Od"
                              aria-label="Wartość brutto od"
                              value={amountFrom}
                              onChange={(e) => setAmountFrom(e.target.value)}
                              className="w-1/2 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              id="amount-to"
                              type="number"
                              min="0"
                              placeholder="Do"
                              aria-label="Wartość brutto do"
                              value={amountTo}
                              onChange={(e) => setAmountTo(e.target.value)}
                              className="w-1/2 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                            />
                          </div>
                        </div>

                        <div className="pt-3 mt-4 border-t border-gray-100 flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setDate(undefined);
                              setIsOverDueFilter('');
                              setCompanyNameFilter('');
                              setCompanyNipFilter('');
                              setAmountFrom('');
                              setAmountTo('');
                            }}
                            className="text-xs text-gray-500 hover:text-gray-900 underline cursor-pointer"
                          >
                            Zresetuj
                          </button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowFilters(false)}
                            className="h-8 px-4 bg-blue-900 text-white hover:bg-blue-800 text-xs cursor-pointer"
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
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 pr-4">
                <p className="font-medium leading-tight">{listError.title}</p>
                {listError.details && listError.details.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                    {listError.details.map((detailErr, idx) => (
                      <li key={`${detailErr}-${idx}`}>{detailErr}</li>
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
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <DataTable
            table={table}
            isLoading={isLoading}
            isError={isError}
            data={accumulatedMobileInvoices}
            pageNumber={pageNumber}
            totalPages={totalPages}
            isFetching={isFetching}
            onMobileLoadMore={handleMobileLoadMore}
            mobileCardKeyExtractor={(item) => item.id}
            renderMobileCard={(item) => (
              <InvoiceMobileCard
                item={item}
                onDownloadPdf={(inv) => setSelectedInvoiceForPdf(inv)}
              />
            )}
            emptyMessage="Brak faktur do wyświetlenia."
            loadingMessage="Wczytywanie listy faktur..."
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

          <DownloadInvoicePdfDialog
            isOpen={Boolean(selectedInvoiceForPdf)}
            onClose={() => setSelectedInvoiceForPdf(null)}
            invoiceId={selectedInvoiceForPdf?.id ?? ''}
            invoiceNumber={selectedInvoiceForPdf?.invoiceNumber ?? ''}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
