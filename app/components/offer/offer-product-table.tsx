import React, { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { api } from '~/api/api';
import { Button } from '~/components/ui/button';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  Package,
  Search,
} from 'lucide-react';
import { formatCurrency } from '~/utils/data-formatters';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/api-error';

export interface OfferProductResponse {
  productId: string;
  productName: string;
  steelGrade: string;
  quantity: number;
  quotedPrice: number;
  currencyCode: string;
  decimalPlaces: number;
}

export interface OfferProductsTableProps {
  offerId: string;
  canEdit?: boolean;
  onEditProducts?: (currentProducts: OfferProductResponse[]) => void;
}

const columnHelper = createColumnHelper<OfferProductResponse>();

const columns = [
  columnHelper.accessor('productName', {
    header: 'Nazwa produktu',
    cell: (info) => <span className="font-semibold text-gray-900">{info.getValue()}</span>,
  }),
  columnHelper.accessor('steelGrade', {
    header: 'Gatunek stali',
    cell: (info) => (
      <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded text-xs font-semibold">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('quantity', {
    header: 'Ilość',
    cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
  }),
  columnHelper.display({
    id: 'quotedPrice',
    header: 'Cena jednostkowa',
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="font-bold text-[#004a8f]">
          {formatCurrency(row.quotedPrice, row.currencyCode, row.decimalPlaces)}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: 'totalPrice',
    header: 'Wartość łączna',
    cell: (info) => {
      const row = info.row.original;
      const total = row.quotedPrice * row.quantity;
      return (
        <span className="font-bold text-gray-900">
          {formatCurrency(total, row.currencyCode, row.decimalPlaces)}
        </span>
      );
    },
  }),
];

export const OfferProductsTable: React.FC<OfferProductsTableProps> = ({
  offerId,
  canEdit,
  onEditProducts,
}) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [accumulatedMobileProducts, setAccumulatedMobileProducts] = useState<
    OfferProductResponse[]
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
    queryKey: ['offer-products', { offerId, pageNumber, pageSize, debouncedSearch }],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
      };
      const response = await api.get(`/offer/product/${offerId}`, { params });
      return response.data?.value || response.data?.data || response.data;
    },
    enabled: Boolean(offerId),
    placeholderData: keepPreviousData,
  });

  const desktopProducts = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalCount || desktopProducts.length;

  useEffect(() => {
    const items: OfferProductResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileProducts(items);
      return;
    }

    setAccumulatedMobileProducts((prev) => {
      const existingIds = new Set(prev.map((item) => item.productId));
      const uniqueIncoming = items.filter((item) => !existingIds.has(item.productId));
      return [...prev, ...uniqueIncoming];
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
        'Nie udało się pobrać listy pozycji oferty.',
      )
    : null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-gray-200">
          <Loader2 className="h-8 w-8 animate-spin text-[#004a8f] mb-2" />
          <p className="text-gray-500 text-sm">Wczytywanie pozycji oferty...</p>
        </div>
      );
    }

    if (!desktopProducts || desktopProducts.length === 0) {
      return (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center gap-3">
          <Package className="h-8 w-8 text-gray-300" />
          <p className="text-gray-500 font-medium text-sm">Brak pozycji w tej ofercie.</p>
        </div>
      );
    }

    return (
      <>
        <div className="block lg:hidden space-y-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h2 className="text-lg font-bold text-gray-900">Produkty w ofercie</h2>
          </div>

          <div className="relative w-full mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj produktu..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f] bg-white"
            />
          </div>

          {accumulatedMobileProducts.map((product) => (
            <div
              key={product.productId}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-2"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{product.productName}</h3>
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium inline-block mt-1">
                    {product.steelGrade}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Ilość</p>
                  <p className="text-sm font-bold text-gray-900">{product.quantity}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-2.5 mt-1 flex justify-between items-center text-xs">
                <div>
                  <span className="text-gray-500 block">Cena jedn.:</span>
                  <span className="font-semibold text-[#004a8f]">
                    {formatCurrency(
                      product.quotedPrice,
                      product.currencyCode,
                      product.decimalPlaces,
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block">Wartość:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {formatCurrency(
                      product.quotedPrice * product.quantity,
                      product.currencyCode,
                      product.decimalPlaces,
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {pageNumber < totalPages && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleMobileLoadMore}
                disabled={isFetching}
                className="w-full bg-[#004a8f] text-white hover:bg-[#003870] transition-all flex items-center justify-center gap-2"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Pokaż kolejne pozycje'
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="hidden lg:flex bg-white border border-gray-200 rounded-xl shadow-sm flex-col">
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto flex-1">
              <h2 className="text-lg font-bold text-gray-900 shrink-0">Produkty w ofercie</h2>
              <div className="relative w-full max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Szukaj produktu..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f] bg-white"
                />
              </div>
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditProducts?.(desktopProducts)}
                  className="text-[#004a8f] border-blue-200 bg-blue-50 hover:bg-blue-100 flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edytuj pozycje
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="border-b border-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-900"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-3.5 text-sm text-gray-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-b-xl border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Pozycji na stronie:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:ring-[#004a8f]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              Wyświetlanie {Math.min((pageNumber - 1) * pageSize + 1, totalItems)} do{' '}
              {Math.min(pageNumber * pageSize, totalItems)} z {totalItems} pozycji
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleDesktopPageChange(Math.max(pageNumber - 1, 1))}
                disabled={pageNumber === 1 || isFetching}
                variant="outline"
                size="icon"
                className="h-8 w-8 text-[#004a8f] border-gray-300 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-gray-700 px-2">
                Strona {pageNumber} z {totalPages}
              </span>
              <Button
                onClick={() => handleDesktopPageChange(Math.min(pageNumber + 1, totalPages))}
                disabled={pageNumber === totalPages || isFetching}
                variant="outline"
                size="icon"
                className="h-8 w-8 text-[#004a8f] border-gray-300 hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {errorMessage && (
        <div className="flex items-center gap-2 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {renderContent()}
    </div>
  );
};
