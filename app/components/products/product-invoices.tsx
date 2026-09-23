import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertCircle, Building2, Calendar, CheckCircle2, Clock, FileText, X } from 'lucide-react';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import { formatCurrency } from '~/utils/data-formatters';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { DataTable } from '~/components/table/data-table';
import type { ProductInvoiceItemResponse } from '~/interfaces/product';

const columnHelper = createColumnHelper<ProductInvoiceItemResponse>();

const mergeInvoices = (
  existing: ProductInvoiceItemResponse[],
  incoming: ProductInvoiceItemResponse[],
): ProductInvoiceItemResponse[] => {
  const existingIds = new Set(existing.map((item) => item.invoiceId));
  const uniqueIncoming = incoming.filter((item) => !existingIds.has(item.invoiceId));
  return [...existing, ...uniqueIncoming];
};

const ProductInvoiceMobileCard = ({
  item,
  unitSymbol,
}: {
  readonly item: ProductInvoiceItemResponse;
  readonly unitSymbol: string;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm relative">
    <div className="flex justify-between items-start gap-2 mb-2">
      <div>
        <Link
          to={`/invoice/${item.invoiceId}`}
          className="text-sm font-bold text-blue-900 hover:underline"
        >
          {item.invoiceNumber}
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
          <Building2 className="w-3.5 h-3.5 text-gray-400" />
          <span>{item.companyName}</span>
        </div>
      </div>

      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
          item.isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}
      >
        {item.isPaid ? (
          <>
            <CheckCircle2 className="w-3 h-3" /> Opłacona
          </>
        ) : (
          <>
            <Clock className="w-3 h-3" /> Oczekuje
          </>
        )}
      </span>
    </div>

    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
      <div className="text-gray-600 text-xs">
        Ilość:{' '}
        <span className="font-semibold text-gray-900">
          {item.quantity} {unitSymbol}
        </span>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">
          {formatCurrency(item.unitPrice, item.currencyCode, item.decimalPlaces)} / {unitSymbol}
        </p>
        <p className="font-bold text-gray-900 text-sm">
          {formatCurrency(item.totalPrice, item.currencyCode, item.decimalPlaces)}
        </p>
      </div>
    </div>

    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-1.5 border-t border-gray-100">
      <div className="flex items-center gap-1">
        <Calendar className="w-3 h-3 text-gray-400" />
        <span>Wystawiono: {format(new Date(item.issueDate), 'dd.MM.yyyy')}</span>
      </div>
      <span>Termin: {format(new Date(item.dueDate), 'dd.MM.yyyy')}</span>
    </div>
  </div>
);

export const ProductInvoices = ({
  productId,
  unitSymbol = 'szt.',
}: {
  readonly productId: string;
  readonly unitSymbol?: string;
}) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [accumulatedMobileInvoices, setAccumulatedMobileInvoices] = useState<
    ProductInvoiceItemResponse[]
  >([]);
  const isMobileAppend = useRef(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    isMobileAppend.current = false;
    setPageNumber(1);
  }, [debouncedSearch, pageSize]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ['product-invoices', productId, { pageNumber, pageSize, debouncedSearch }],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
      };

      const response = await api.get(`/products/${productId}/invoices`, { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopInvoices = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopInvoices.length;

  useEffect(() => {
    const items: ProductInvoiceItemResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileInvoices(items);
      return;
    }

    setAccumulatedMobileInvoices((prev) => mergeInvoices(prev, items));
  }, [data, pageNumber]);

  const handleMobileLoadMore = () => {
    isMobileAppend.current = true;
    setPageNumber((prev) => prev + 1);
  };

  const handleDesktopPageChange = (newPage: number) => {
    isMobileAppend.current = false;
    setPageNumber(newPage);
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'invoiceNumber',
        header: 'Numer faktury',
        cell: (info) => (
          <Link
            to={`/invoice/${info.row.original.invoiceId}`}
            className="font-medium text-blue-900 hover:underline"
          >
            {info.row.original.invoiceNumber}
          </Link>
        ),
      }),
      columnHelper.accessor('companyName', {
        header: 'Nabywca',
        cell: (info) => <span className="text-gray-900 font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('isPaid', {
        header: 'Status',
        cell: (info) => {
          const isPaid = info.getValue();
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${
                isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isPaid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Opłacona
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" /> Oczekuje
                </>
              )}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'quantity',
        header: 'Ilość',
        cell: (info) => (
          <span className="font-medium text-gray-900">
            {info.row.original.quantity}{' '}
            <span className="text-gray-500 font-normal">{unitSymbol}</span>
          </span>
        ),
      }),
      columnHelper.display({
        id: 'unitPrice',
        header: 'Cena jedn.',
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="text-gray-900 font-medium">
              {formatCurrency(row.unitPrice, row.currencyCode, row.decimalPlaces)}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'totalPrice',
        header: 'Wartość łączna',
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="font-bold text-gray-900">
              {formatCurrency(row.totalPrice, row.currencyCode, row.decimalPlaces)}
            </span>
          );
        },
      }),
      columnHelper.accessor('issueDate', {
        header: 'Data wystawienia',
        cell: (info) => (
          <span className="text-gray-500 text-xs">
            {format(new Date(info.getValue()), 'dd.MM.yyyy')}
          </span>
        ),
      }),
    ],
    [unitSymbol],
  );

  const table = useReactTable({
    data: desktopInvoices,
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

  const formError: FormErrorState | null =
    isError && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message ||
              activeError?.message ||
              'Nie udało się pobrać faktur powiązanych z produktem.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 w-full min-w-0 max-w-full overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <h2 className="text-base sm:text-lg font-medium text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500 shrink-0" />
            <span>Powiązane faktury</span>
          </h2>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium shrink-0">
            {totalItems}
          </span>
        </div>

        <div className="w-full sm:w-72 md:w-80 min-w-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Szukaj numeru faktury lub firmy..."
            className="w-full border border-gray-300 rounded-md bg-white px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
        </div>
      </div>

      <div className="p-4 sm:p-6 min-w-0 w-full overflow-x-auto">
        {formError && (
          <div className="mb-6 relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 pr-4">
              <p className="font-medium leading-tight">{formError.title}</p>
              {formError.details && formError.details.length > 0 && (
                <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                  {formError.details.map((detailErr, idx) => (
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
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="w-full min-w-0 overflow-x-auto">
          <DataTable
            table={table}
            isLoading={isLoading}
            isError={isError}
            data={accumulatedMobileInvoices}
            pageNumber={pageNumber}
            totalPages={totalPages}
            isFetching={isFetching}
            onMobileLoadMore={handleMobileLoadMore}
            mobileCardKeyExtractor={(item) => item.invoiceId}
            renderMobileCard={(item) => (
              <ProductInvoiceMobileCard item={item} unitSymbol={unitSymbol} />
            )}
            emptyMessage="Ten produkt nie został jeszcze zafakturowany na żadnej fakturze."
            loadingMessage="Ładowanie powiązanych faktur..."
            paginationProps={{
              pageNumber,
              pageSize,
              totalPages,
              totalItems,
              isFetching,
              onPageSizeChange: setPageSize,
              onPageChange: handleDesktopPageChange,
              pageSizeOptions: [5, 10, 20],
            }}
          />
        </div>
      </div>
    </div>
  );
};
