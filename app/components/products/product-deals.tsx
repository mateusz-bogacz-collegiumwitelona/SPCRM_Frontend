import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Briefcase } from 'lucide-react';
import { client } from '~/lib/client';
import { getStatusConfig } from '~/constants/sale-status';
import { formatCurrency } from '~/utils/data-formatters';
import { DataTable } from '~/components/table/data-table';
import type { ProductDealItemResponse } from '~/types/product';
import { useDebounce } from '~/hooks/use-debounce';
import { ProductDealMobileCard } from '~/components/products/mobile-card/product-deal-mobile-card';
import { QueryErrorBanner } from '~/components/ui/query-error-banner';
import { useAccumulatedMobileList } from '~/hooks/use-accumulated-mobile-list';

interface ProductDealsTableMeta {
  unitSymbol: string;
}
const columnHelper = createColumnHelper<ProductDealItemResponse>();

const columns = [
  columnHelper.display({
    id: 'dealName',
    header: 'Szansa sprzedaży',
    cell: (info) => (
      <Link
        to={`/sale/${info.row.original.dealId}`}
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
    cell: (info) => {
      const meta = info.table.options.meta as ProductDealsTableMeta;
      return (
        <span className="font-medium text-gray-900">
          {info.row.original.quantity}{' '}
          <span className="text-gray-500 font-normal">{meta?.unitSymbol || 'szt.'}</span>
        </span>
      );
    },
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
];

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

  const debouncedSearch = useDebounce(searchTerm, 300);

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

      const response = await client.get(`/products/${productId}/deals`, { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopDeals = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopDeals.length;

  const table = useReactTable({
    data: desktopDeals,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { unitSymbol } satisfies ProductDealsTableMeta,
  });

  const {
    accumulatedData: accumulatedMobileDeals,
    handleMobileLoadMore,
    handleDesktopPageChange,
  } = useAccumulatedMobileList<ProductDealItemResponse>({
    items: data?.items,
    pageNumber,
    setPageNumber,
    resetDependencies: [debouncedSearch, pageSize],
    idSelector: (item) => item.dealId,
  });

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
        <QueryErrorBanner
          error={queryError}
          fallbackMessage="Nie udało się pobrać danych sprzedaży."
          className="mb-6"
        />

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
