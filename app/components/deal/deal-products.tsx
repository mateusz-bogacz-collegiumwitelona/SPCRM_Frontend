import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { formatCurrency } from '~/utils/data-formatters';
import { Link } from 'react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Filter,
  PackageOpen,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/table/data-table';
import { AddDealProductDialog } from '~/components/deal/dialogs/add-deal-product-dialog';
import { DeleteDealProductDialog } from '~/components/deal/dialogs/delete-deal-product-dialog';
import { EditDealProductDialog } from '~/components/deal/dialogs/edit-deal-product-dialog';

interface DealProductResponse {
  dealProductId: string;
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

interface ProductTableMeta {
  onEdit: (product: DealProductResponse) => void;
  onDelete: (product: DealProductResponse) => void;
}

const columnHelper = createColumnHelper<DealProductResponse>();

const columns = [
  columnHelper.display({
    id: 'productName',
    header: 'Nazwa produktu',
    cell: (info) => <span className="font-medium text-gray-900">{info.row.original.name}</span>,
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
    cell: (info) => (
      <span className="font-bold text-gray-900">
        {formatCurrency(
          info.row.original.totalPrice,
          info.row.original.currencyCode,
          info.row.original.decimalPlaces,
        )}
      </span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: (info) => {
      const meta = info.table.options.meta as ProductTableMeta;
      const product = info.row.original;

      return (
        <div className="flex items-center gap-3">
          <Link
            to={`/products/${product.productId}`}
            className="font-medium text-blue-900 hover:underline text-xs"
          >
            Detale
          </Link>
          <button
            type="button"
            onClick={() => meta.onEdit(product)}
            className="text-gray-400 hover:text-[#004a8f] transition-colors"
            title="Edytuj pozycję"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => meta.onDelete(product)}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Usuń pozycję"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    },
  }),
];

const mergeProducts = (
  existing: DealProductResponse[],
  incoming: DealProductResponse[],
): DealProductResponse[] => {
  const existingIds = new Set(existing.map((item) => item.dealProductId));
  const uniqueIncoming = incoming.filter((item) => !existingIds.has(item.dealProductId));
  return [...existing, ...uniqueIncoming];
};

const ProductMobileCard = ({
  product,
  onEditClick,
  onDeleteClick,
}: {
  product: DealProductResponse;
  onEditClick: (product: DealProductResponse) => void;
  onDeleteClick: (product: DealProductResponse) => void;
}) => {
  const hasDiscount = product.baseUnitPrice > product.unitPrice;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm relative">
      <div className="flex justify-between items-start mb-2 pr-16">
        <div>
          <p className="text-sm font-bold text-[#004a8f]">{product.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">Wymiary: {product.dimensions}</p>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEditClick(product)}
          className="text-gray-400 hover:text-[#004a8f] p-1 rounded"
          title="Edytuj pozycję"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteClick(product)}
          className="text-gray-400 hover:text-red-600 p-1 rounded"
          title="Usuń pozycję"
        >
          <Trash2 className="w-4 h-4" />
        </button>
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
              {formatCurrency(product.baseUnitPrice, product.currencyCode, product.decimalPlaces)}
            </p>
          )}
          <p className="font-bold text-gray-900">
            {formatCurrency(product.unitPrice, product.currencyCode, product.decimalPlaces)}{' '}
            {product.currencyCode}
          </p>
        </div>
      </div>
    </div>
  );
};

export const SaleProductsTable = ({ dealId }: { dealId: string }) => {
  const queryClient = useQueryClient();

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<DealProductResponse | null>(null);
  const [productToDelete, setProductToDelete] = useState<DealProductResponse | null>(null);

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

  const deleteProductMutation = useMutation({
    mutationFn: async (dealProductId: string) => {
      return await api.delete(`/sales/${dealId}/products/${dealProductId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['deal-products', dealId] });
      await queryClient.invalidateQueries({ queryKey: ['deal-info', dealId] });
      await queryClient.invalidateQueries({ queryKey: ['deals-list'] });
      setProductToDelete(null);
    },
  });

  const desktopProducts = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopProducts.length;

  const dealCache = queryClient.getQueryData<{ currencyCode: string }>(['deal-info', dealId]);
  const currentCurrency = dealCache?.currencyCode || desktopProducts[0]?.currencyCode || 'PLN';

  useEffect(() => {
    const items: DealProductResponse[] = data?.items;
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

  const table = useReactTable({
    data: desktopProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onEdit: (product: DealProductResponse) => setProductToEdit(product),
      onDelete: (product: DealProductResponse) => setProductToDelete(product),
    } satisfies ProductTableMeta,
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
              'Nie udało się pobrać listy produktów w zamówieniu.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <PackageOpen className="w-5 h-5 text-gray-500" />
              Pozycje zamówienia
            </h2>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddProductOpen(true)}
              className="bg-[#004a8f] text-white hover:bg-[#003870] flex items-center gap-1.5 text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj produkt</span>
            </Button>
          </div>

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
                        <label
                          htmlFor="sale-product-category"
                          className="text-xs font-medium text-gray-700 mb-1"
                        >
                          Kategoria
                        </label>
                        <input
                          id="sale-product-category"
                          type="text"
                          value={productFilter}
                          onChange={(e) => setProductFilter(e.target.value)}
                          placeholder="np. Rury, Blachy..."
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#004a8f]"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label
                          htmlFor="sale-product-steel-grade"
                          className="text-xs font-medium text-gray-700 mb-1"
                        >
                          Gatunek stali
                        </label>
                        <input
                          id="sale-product-steel-grade"
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
          {formError && (
            <div className="mb-6 relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 pr-4">
                <p className="font-medium leading-tight">{formError.title}</p>
                {formError.details && formError.details.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                    {formError.details.map((detailErr, idx) => (
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
            data={accumulatedMobileProducts}
            pageNumber={pageNumber}
            totalPages={totalPages}
            isFetching={isFetching}
            onMobileLoadMore={handleMobileLoadMore}
            mobileCardKeyExtractor={(item) => item.dealProductId}
            renderMobileCard={(item) => (
              <ProductMobileCard
                product={item}
                onEditClick={(prod) => setProductToEdit(prod)}
                onDeleteClick={(prod) => setProductToDelete(prod)}
              />
            )}
            emptyMessage="Brak produktów do wyświetlenia."
            loadingMessage="Ładowanie produktów..."
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

      <AddDealProductDialog
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        dealId={dealId}
        currencyCode={currentCurrency}
      />

      <EditDealProductDialog
        isOpen={Boolean(productToEdit)}
        onClose={() => setProductToEdit(null)}
        dealId={dealId}
        product={productToEdit}
        currencyCode={currentCurrency}
      />

      <DeleteDealProductDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={async () => {
          if (!productToDelete) return;
          await deleteProductMutation.mutateAsync(productToDelete.dealProductId);
        }}
        isLoading={deleteProductMutation.isPending}
        productName={productToDelete?.name}
      />
    </>
  );
};
