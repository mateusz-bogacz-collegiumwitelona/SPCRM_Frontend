import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { formatCurrency } from '~/utils/data-formatters';
import { Link } from 'react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/apiError';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  PackageOpen,
} from 'lucide-react';
import { Button } from '~/components/ui/button';

interface DealProductResponse {
  productId: string;
  name: string;
  steelGrade: string;
  dimensions: string;
  quantity: number;
  unitSymbol: string;
  baseUnitPrice: number;
  unitPrice: number;
  totalPrice: number;
  currencyCode: string;
  decimalPlaces: number;
}

const columnHelper = createColumnHelper<DealProductResponse>();

const columns = [
  columnHelper.display({
    id: 'productName',
    header: 'Nazwa produktu',
    cell: (info) => {
      const row = info.row.original;
      return <span className="font-medium text-gray-900">{row.name}</span>;
    },
  }),
  columnHelper.accessor('steelGrade', {
    header: 'Gatunek',
    cell: (info) => (
      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('dimensions', {
    header: 'Wymiary',
    cell: (info) => <span className="text-gray-500">{info.getValue()}</span>,
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
    cell: (info) => {
      const row = info.row.original;
      const isHasDiscount = row.baseUnitPrice > row.unitPrice;

      return (
        <div className="flex flex-col items-start">
          {isHasDiscount && (
            <span className="text-xs text-gray-400 line-through mb-0.5">
              {formatCurrency(row.baseUnitPrice, row.currencyCode, row.decimalPlaces)}
            </span>
          )}
          <span
            className={isHasDiscount ? 'text-green-600 font-bold' : 'text-gray-900 font-medium'}
          >
            {formatCurrency(row.unitPrice, row.currencyCode, row.decimalPlaces)}
          </span>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: 'totalPrice',
    header: 'Wartość ostateczna',
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="font-bold text-gray-900">
          {formatCurrency(row.totalPrice, row.currencyCode, row.decimalPlaces)}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: (info) => (
      <Link
        to={`/products/${info.row.original.productId}`}
        className="font-medium text-blue-900 hover:underline"
      >
        Detale
      </Link>
    ),
  }),
];

export const SaleProductsTable = ({ dealId }: { dealId: string }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDescending, setSortDescending] = useState<boolean>(false);

  const [showFilters, setShowFilters] = useState(false);
  const [productFilter, setProductFilter] = useState<string>('');
  const [steelGradeFilter, setSteelGradeFilter] = useState<string>('');

  const [accumulatedMobileProducts, setAccumulatedMobileProducts] = useState<DealProductResponse[]>(
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
  }, [debouncedSearch, sortBy, sortDescending, pageSize, productFilter, steelGradeFilter]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: [
      'deal-products',
      dealId,
      {
        pageNumber,
        pageSize,
        debouncedSearch,
        sortBy,
        sortDescending,
        productFilter,
        steelGradeFilter,
      },
    ],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
        SortBy: sortBy,
        SortDescending: sortDescending,
        ProductCategory: productFilter || undefined,
        SteelGrade: steelGradeFilter || undefined,
      };

      const response = await api.get(`/sales/${dealId}/products`, { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopProducts = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopProducts.length;

  useEffect(() => {
    if (!data?.items) return;

    setAccumulatedMobileProducts((prev) => {
      if (pageNumber === 1) return data.items;

      if (isMobileAppend.current) {
        const newItems = data.items.filter(
          (newItem: DealProductResponse) => !prev.some((p) => p.productId === newItem.productId),
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
    data: desktopProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const errorMessage = isError
    ? getErrorMessage(
        (queryError as ApiError)?.response?.data?.errorCode,
        'Nie udało się pobrać listy produktów w zamówieniu.',
      )
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
          <PackageOpen className="w-5 h-5 text-gray-500" />
          Pozycje zamówienia
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Szukaj produktu..."
            className="w-full sm:w-64 border border-gray-300 rounded-md bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004a8f]"
          />

          <div className="flex w-full sm:w-auto items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-[#004a8f]"
            >
              <option value="name">Nazwa</option>
              <option value="steelgrade">Gatunek</option>
              <option value="quantity">Ilość</option>
              <option value="totalprice">Wartość</option>
            </select>

            <Button
              variant="outline"
              onClick={() => setSortDescending(!sortDescending)}
              className="shrink-0 text-gray-700 border-gray-300 px-3"
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
                className="flex items-center gap-2 text-gray-700 border-gray-300"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtry</span>
                {(productFilter || steelGradeFilter) && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#004a8f]"></span>
                  </span>
                )}
              </Button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Filtruj asortyment</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-700 mb-1">Kategoria</label>
                      <input
                        type="text"
                        value={productFilter}
                        onChange={(e) => setProductFilter(e.target.value)}
                        placeholder="np. Rury, Blachy..."
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#004a8f]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-700 mb-1">
                        Gatunek stali
                      </label>
                      <input
                        type="text"
                        value={steelGradeFilter}
                        onChange={(e) => setSteelGradeFilter(e.target.value)}
                        placeholder="np. S355J2"
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#004a8f]"
                      />
                    </div>
                    <div className="pt-3 mt-2 border-t border-gray-100 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setProductFilter('');
                          setSteelGradeFilter('');
                        }}
                        className="text-xs text-gray-500 hover:text-gray-900 underline"
                      >
                        Wyczyść
                      </button>
                      <Button
                        size="sm"
                        onClick={() => setShowFilters(false)}
                        className="h-8 px-4 bg-[#004a8f] text-white text-xs"
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

      <div className="p-4 lg:p-6">
        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-[#004a8f] mb-4" />
            <p className="text-gray-500 font-medium">Ładowanie produktów...</p>
          </div>
        ) : desktopProducts.length === 0 && !isError ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Brak produktów do wyświetlenia.</p>
          </div>
        ) : (
          <>
            <div className="block lg:hidden space-y-4">
              {accumulatedMobileProducts.map((product) => {
                const hasDiscount = product.baseUnitPrice > product.unitPrice;
                return (
                  <div
                    key={product.productId}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-2">
                      <p className="text-sm font-bold text-[#004a8f]">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Wymiary: {product.dimensions}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
                      <div className="text-gray-600">
                        Ilość:{' '}
                        <span className="font-semibold text-gray-900">
                          {product.quantity} {product.unitSymbol}
                        </span>
                      </div>
                      <div className="text-right">
                        {hasDiscount && (
                          <p className="text-[10px] text-gray-400 line-through">
                            {formatCurrency(
                              product.baseUnitPrice,
                              product.currencyCode,
                              product.decimalPlaces,
                            )}
                          </p>
                        )}
                        <p className="font-bold text-gray-900">
                          {formatCurrency(
                            product.unitPrice,
                            product.currencyCode,
                            product.decimalPlaces,
                          )}{' '}
                          {product.currencyCode}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {pageNumber < totalPages && (
                <Button
                  onClick={handleMobileLoadMore}
                  disabled={isFetching}
                  className="w-full bg-[#004a8f] text-white hover:bg-blue-800 flex items-center justify-center gap-2"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie...
                    </>
                  ) : (
                    'Pokaż więcej'
                  )}
                </Button>
              )}
            </div>

            <div className="hidden lg:block">
              <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-900 font-semibold">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} className="px-6 py-4">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-6 py-4 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Pozycji:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-[#004a8f]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="text-sm text-gray-500">
                  Widok {Math.min((pageNumber - 1) * pageSize + 1, totalItems)} -{' '}
                  {Math.min(pageNumber * pageSize, totalItems)} z {totalItems}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDesktopPageChange(Math.max(pageNumber - 1, 1))}
                    disabled={pageNumber === 1 || isFetching}
                    className="h-8 w-8 text-[#004a8f]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">
                    Strona {pageNumber} z {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDesktopPageChange(Math.min(pageNumber + 1, totalPages))}
                    disabled={pageNumber === totalPages || isFetching}
                    className="h-8 w-8 text-[#004a8f]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
