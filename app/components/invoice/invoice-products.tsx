import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { formatCurrency } from '~/utils/data-formatters';
import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { AlertCircle, PackageOpen, X } from 'lucide-react';
import { DataTable } from '~/components/table/data-table';
import type { InvoiceProductsListResponse } from '~/interfaces/invoice';

const columnHelper = createColumnHelper<InvoiceProductsListResponse>();

const mergeProducts = (
  existing: InvoiceProductsListResponse[],
  incoming: InvoiceProductsListResponse[],
): InvoiceProductsListResponse[] => {
  const existingIds = new Set(existing.map((item) => item.invoiceProductId));
  const uniqueIncoming = incoming.filter((item) => !existingIds.has(item.invoiceProductId));
  return [...existing, ...uniqueIncoming];
};

const ProductMobileCard = ({
  product,
  currencyCode,
  decimalPlaces,
}: {
  readonly product: InvoiceProductsListResponse;
  readonly currencyCode: string;
  readonly decimalPlaces: number;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm relative">
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="text-sm font-bold text-blue-900">{product.productName}</p>
        {product.steelGrade && (
          <span className="inline-block mt-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-semibold">
            {product.steelGrade}
          </span>
        )}
      </div>
    </div>

    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
      <div className="text-gray-600">
        Ilość:{' '}
        <span className="font-semibold text-gray-900">
          {product.quantity} {product.unitSymbol}
        </span>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">
          {formatCurrency(product.unitPrice, currencyCode, decimalPlaces)} / {product.unitSymbol}
        </p>
        <p className="font-bold text-gray-900">
          {formatCurrency(product.totalPrice, currencyCode, decimalPlaces)}
        </p>
      </div>
    </div>
  </div>
);

export const InvoiceProductsTable = ({
  invoiceId,
  currencyCode = 'PLN',
  decimalPlaces = 2,
}: {
  readonly invoiceId: string;
  readonly currencyCode?: string;
  readonly decimalPlaces?: number;
}) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [accumulatedMobileProducts, setAccumulatedMobileProducts] = useState<
    InvoiceProductsListResponse[]
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
    queryKey: [
      'invoice-products',
      invoiceId,
      {
        pageNumber,
        pageSize,
        debouncedSearch,
      },
    ],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
      };

      const response = await api.get(`/invoice/${invoiceId}/products`, { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopProducts = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopProducts.length;

  useEffect(() => {
    const items: InvoiceProductsListResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileProducts(items);
      return;
    }

    setAccumulatedMobileProducts((prev) => mergeProducts(prev, items));
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
        id: 'productName',
        header: 'Nazwa towaru / usługi',
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.row.original.productName}</span>
        ),
      }),
      columnHelper.accessor('steelGrade', {
        header: 'Gatunek',
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <span className="text-gray-400">-</span>;
          return (
            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
              {val}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'quantity',
        header: 'Ilość',
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="font-medium text-gray-900">
              {row.quantity} <span className="text-gray-500 font-normal">{row.unitSymbol}</span>
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'unitPrice',
        header: 'Cena jedn. netto',
        cell: (info) => (
          <span className="text-gray-900 font-medium">
            {formatCurrency(info.row.original.unitPrice, currencyCode, decimalPlaces)}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'totalPrice',
        header: 'Wartość łączna',
        cell: (info) => (
          <span className="font-bold text-gray-900">
            {formatCurrency(info.row.original.totalPrice, currencyCode, decimalPlaces)}
          </span>
        ),
      }),
    ],
    [currencyCode, decimalPlaces],
  );

  const table = useReactTable({
    data: desktopProducts,
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
              'Nie udało się pobrać pozycji faktury.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-gray-500" />
            Pozycje faktury
          </h2>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
            {totalItems}
          </span>
        </div>

        <div className="w-full md:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Szukaj pozycji (nazwa, gatunek, j.m.)..."
            className="w-full sm:w-72 border border-gray-300 rounded-md bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
        </div>
      </div>

      <div className="p-4 lg:p-6">
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

        <DataTable
          table={table}
          isLoading={isLoading}
          isError={isError}
          data={accumulatedMobileProducts}
          pageNumber={pageNumber}
          totalPages={totalPages}
          isFetching={isFetching}
          onMobileLoadMore={handleMobileLoadMore}
          mobileCardKeyExtractor={(item) => item.invoiceProductId}
          renderMobileCard={(item) => (
            <ProductMobileCard
              product={item}
              currencyCode={currencyCode}
              decimalPlaces={decimalPlaces}
            />
          )}
          emptyMessage="Brak pozycji na tej fakturze."
          loadingMessage="Ładowanie pozycji faktury..."
          paginationProps={{
            pageNumber,
            pageSize,
            totalPages,
            totalItems,
            isFetching,
            onPageSizeChange: setPageSize,
            onPageChange: handleDesktopPageChange,
            pageSizeOptions: [10, 25, 50],
          }}
        />
      </div>
    </div>
  );
};
