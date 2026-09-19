import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertCircle, Briefcase, Calendar, Building2, X } from 'lucide-react';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import { getStatusConfig } from '~/utils/sale-status';
import { formatCurrency } from '~/utils/data-formatters';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { DataTable } from '~/components/table/data-table';

export interface ProductDealItemResponse {
  dealId: string;
  dealName: string;
  companyName: string;
  status: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currencyCode: string;
  decimalPlaces: number;
  closeDate: string;
}

const columnHelper = createColumnHelper<ProductDealItemResponse>();

const mergeDeals = (
  existing: ProductDealItemResponse[],
  incoming: ProductDealItemResponse[],
): ProductDealItemResponse[] => {
  const existingIds = new Set(existing.map((item) => item.dealId));
  const uniqueIncoming = incoming.filter((item) => !existingIds.has(item.dealId));
  return [...existing, ...uniqueIncoming];
};

const ProductDealMobileCard = ({
  item,
  unitSymbol,
}: {
  readonly item: ProductDealItemResponse;
  readonly unitSymbol: string;
}) => {
  const statusCfg = getStatusConfig(item.status);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm relative">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div>
          <Link
            to={`/sales/${item.dealId}`}
            className="text-sm font-bold text-blue-900 hover:underline"
          >
            {item.dealName}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            <span>{item.companyName}</span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bgColor} ${statusCfg.textColor}`}
        >
          {statusCfg.label}
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

      <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-2 pt-1.5 border-t border-gray-100">
        <Calendar className="w-3 h-3 text-gray-400" />
        <span>Termin: {format(new Date(item.closeDate), 'dd.MM.yyyy')}</span>
      </div>
    </div>
  );
};

export const ProductDeals = ({
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

  const [accumulatedMobileDeals, setAccumulatedMobileDeals] = useState<ProductDealItemResponse[]>(
    [],
  );
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
    queryKey: ['product-deals', productId, { pageNumber, pageSize, debouncedSearch }],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
      };

      const response = await api.get(`/products/${productId}/deals`, { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopDeals = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopDeals.length;

  useEffect(() => {
    const items: ProductDealItemResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileDeals(items);
      return;
    }

    setAccumulatedMobileDeals((prev) => mergeDeals(prev, items));
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
        id: 'dealName',
        header: 'Szansa sprzedaży',
        cell: (info) => (
          <Link
            to={`/sales/${info.row.original.dealId}`}
            className="font-medium text-blue-900 hover:underline"
          >
            {info.row.original.dealName}
          </Link>
        ),
      }),
      columnHelper.accessor('companyName', {
        header: 'Klient',
        cell: (info) => <span className="text-gray-900 font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const statusCfg = getStatusConfig(info.getValue());
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusCfg.bgColor} ${statusCfg.textColor}`}
            >
              {statusCfg.label}
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
      columnHelper.accessor('closeDate', {
        header: 'Termin',
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
    data: desktopDeals,
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
              'Nie udało się pobrać szans sprzedaży powiązanych z produktem.',
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
            <Briefcase className="w-5 h-5 text-gray-500" />
            Powiązane szanse sprzedaży
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
            placeholder="Szukaj po nazwie transakcji lub kliencie..."
            className="w-full sm:w-80 border border-gray-300 rounded-md bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
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
          data={accumulatedMobileDeals}
          pageNumber={pageNumber}
          totalPages={totalPages}
          isFetching={isFetching}
          onMobileLoadMore={handleMobileLoadMore}
          mobileCardKeyExtractor={(item) => item.dealId}
          renderMobileCard={(item) => <ProductDealMobileCard item={item} unitSymbol={unitSymbol} />}
          emptyMessage="Ten produkt nie jest powiązany z żadną szansą sprzedaży."
          loadingMessage="Ładowanie szans sprzedaży..."
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
  );
};
