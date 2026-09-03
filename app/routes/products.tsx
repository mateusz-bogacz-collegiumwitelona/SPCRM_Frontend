import {createColumnHelper, getCoreRowModel, useReactTable} from '@tanstack/react-table';
import {Link} from 'react-router';
import {useEffect, useMemo, useRef, useState} from 'react';
import {keepPreviousData, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {api} from '~/api/api';
import {getErrorMessage} from '~/utils/error-mapper';
import type ApiError, {FormErrorState} from '~/interfaces/api-error';
import {
    AlertCircle,
    ArrowDownWideNarrow,
    ArrowUpNarrowWide,
    Edit2,
    Filter,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import {Button} from '~/components/ui/button';
import {MainLayout} from '~/components/layout/main-layout';
import {RoleGuard} from '~/lib/role-guard';
import {AuthGuard} from '~/lib/auth-guard';
import {DataTable} from '~/components/common/data-table';
import {mergeById} from '~/utils/table-helpers';
import {AddProductDialog, type AddProductRequest} from '~/components/products/add-product-dialog';
import {EditProductDialog, type EditProductRequest,} from '~/components/products/edit-product-dialog';
import {DeleteProductDialog} from '~/components/products/delete-product-dialog';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from '~/components/ui/dropdown-menu';

interface ProductResponse {
  id: string;
  name: string;
  steelGrade: string;
  category: string;
  dimensions: string;
  stockQuantity: number;
  unitSymbol: string;
  isActivePromotion: boolean;
}

interface SteelGradeResponse {
  id: string;
  name: string;
}

interface ProductTableMeta {
  onEdit: (id: string) => void;
  onDelete: (product: { id: string; name: string }) => void;
}

const columnHelper = createColumnHelper<ProductResponse>();

const columns = [
  columnHelper.display({
    id: 'productName',
    header: 'Nazwa produktu',
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{row.name}</span>
          {row.isActivePromotion && (
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Promocja
            </span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor('category', {
    header: 'Kategoria',
    cell: (info) => (
      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
        {info.getValue()}
      </span>
    ),
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
    header: 'Ilość na stanie',
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="font-medium text-gray-900">
          {row.stockQuantity} <span className="text-gray-500 font-normal">{row.unitSymbol}</span>
        </span>
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: (info) => {
      const product = info.row.original;
      const meta = info.table.options.meta as ProductTableMeta;

      return (
        <div className="flex items-center gap-3">
          <Link
            to={`/products/${product.id}`}
            className="font-medium text-blue-900 hover:underline"
          >
            Szczegóły
          </Link>
          <RoleGuard allowedRoles={['Manager', 'Admin']}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-[#004a8f]"
                >
                  <span className="sr-only">Otwórz menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-40 bg-white">
                <DropdownMenuItem
                  onClick={() => meta.onEdit(product.id)}
                  className="cursor-pointer text-sm text-gray-700 focus:bg-gray-50"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  <span>Edytuj</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => meta.onDelete({ id: product.id, name: product.name })}
                  className="cursor-pointer text-sm text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Usuń</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </RoleGuard>
        </div>
      );
    },
  }),
];

const ProductMobileCard = ({
  product,
  onEdit,
}: {
  readonly product: ProductResponse;
  readonly onEdit: (id: string) => void;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-2">
      <p className="text-sm font-bold text-blue-900">{product.name}</p>
      <p className="text-xs text-gray-500 mt-1">Wymiary: {product.dimensions}</p>
    </div>
    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
      <div className="text-gray-600">
        Ilość: {product.stockQuantity} {product.unitSymbol}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onEdit(product.id)}
          className="text-xs font-medium text-gray-600 hover:text-blue-900 flex items-center gap-1"
        >
          <Pencil className="w-3 h-3" /> Edytuj
        </button>
        <Link
          to={`/products/${product.id}`}
          className="text-xs font-medium text-blue-900 hover:underline"
        >
          Detale
        </Link>
      </div>
    </div>
  </div>
);

export default function ProductsList() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDescending, setSortDescending] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);
  const [productFilter, setProductFilter] = useState<string>('');
  const [steelGradeFilter, setSteelGradeFilter] = useState<string>('');

  const [accumulatedMobileProducts, setAccumulatedMobileProducts] = useState<ProductResponse[]>([]);
  const isMobileAppend = useRef(false);

  const [hasActivePromotion, setHasActivePromotion] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<{ id: string; name: string } | null>(null);

  const queryClient = useQueryClient();

  const addProductMutation = useMutation({
    mutationFn: async (newProduct: AddProductRequest) => {
      await api.post('/products', newProduct);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products-list'] });
      setIsAddModalOpen(false);
    },
  });

  const editProductMutation = useMutation({
    mutationFn: async (updatedProduct: EditProductRequest) => {
      await api.put(`/products/${updatedProduct.productId}`, updatedProduct);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products-list'] });
      await queryClient.invalidateQueries({ queryKey: ['product-details'] });
      await queryClient.invalidateQueries({ queryKey: ['product-for-edit'] });
      setEditingProductId(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/products/${productId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products-list'] });
      setDeletingProduct(null);
    },
  });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    isMobileAppend.current = false;
    setPageNumber(1);
  }, [debouncedSearch, sortBy, sortDescending, pageSize, productFilter, steelGradeFilter]);

  const { data: categoriesResponse } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const response = await api.get('/products/categories');
      return response.data?.value || response.data?.data || response.data || [];
    },
  });
  const availableCategories: string[] = Array.isArray(categoriesResponse) ? categoriesResponse : [];

  const { data: steelGradesResponse } = useQuery<SteelGradeResponse[]>({
    queryKey: ['product-steel-grades'],
    queryFn: async () => {
      const response = await api.get('/products/steel-grades');
      return response.data?.value || response.data?.data || response.data || [];
    },
  });
  const availableSteelGrades: SteelGradeResponse[] = Array.isArray(steelGradesResponse)
    ? steelGradesResponse
    : [];

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: [
      'products-list',
      {
        pageNumber,
        pageSize,
        debouncedSearch,
        sortBy,
        sortDescending,
        productFilter,
        steelGradeFilter,
        hasActivePromotion,
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
        HasActivePromotion: hasActivePromotion ? true : undefined,
      };

      const response = await api.get(`products`, { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopProducts = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopProducts.length;

  useEffect(() => {
    const items: ProductResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileProducts(items);
      return;
    }

    setAccumulatedMobileProducts((prev) => mergeById(prev, items));
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
      onEdit: (id) => setEditingProductId(id),
      onDelete: (product) => setDeletingProduct(product),
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

  const listError: FormErrorState | null =
    isError && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message ||
              activeError?.message ||
              'Nie udało się pobrać listy produktów.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager', 'Admin']} redirectTo="/dashboard">
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6 flex justify-between items-center">
            <h1 className="text-lg lg:text-2xl font-semibold flex items-center gap-2">Produkty</h1>
            <RoleGuard allowedRoles={['Admin']}>
              <Button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="bg-white text-blue-900 hover:bg-gray-100 font-medium text-xs sm:text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Dodaj produkt
              </Button>
            </RoleGuard>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-full md:w-80 shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Wyszukaj produkt..."
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
                  <option value="name">Nazwa</option>
                  <option value="steelgrade">Gatunek</option>
                  <option value="quantity">Ilość</option>
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
                    {(productFilter || steelGradeFilter || hasActivePromotion) && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-900" />
                      </span>
                    )}
                  </Button>

                  {showFilters && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Filtruj asortyment</h3>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <label
                            htmlFor="product-category-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Kategoria
                          </label>
                          <select
                            id="product-category-filter"
                            value={productFilter}
                            onChange={(e) => setProductFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                          >
                            <option value="">Wszystkie kategorie</option>
                            {availableCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label
                            htmlFor="product-steel-grade-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Gatunek stali
                          </label>
                          <select
                            id="product-steel-grade-filter"
                            value={steelGradeFilter}
                            onChange={(e) => setSteelGradeFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                          >
                            <option value="">Wszystkie gatunki</option>
                            {availableSteelGrades.map((grade) => (
                              <option key={grade.id} value={grade.name}>
                                {grade.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 mt-4 bg-gray-50 p-2 rounded border border-gray-100">
                          <input
                            type="checkbox"
                            id="promoFilter"
                            checked={hasActivePromotion}
                            onChange={(e) => setHasActivePromotion(e.target.checked)}
                            className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 h-4 w-4"
                          />
                          <label
                            htmlFor="promoFilter"
                            className="text-xs font-medium text-gray-700 cursor-pointer select-none"
                          >
                            Pokaż tylko w promocji
                          </label>
                        </div>

                        <div className="pt-3 mt-4 border-t border-gray-100 flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setProductFilter('');
                              setSteelGradeFilter('');
                              setHasActivePromotion(false);
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
            data={accumulatedMobileProducts}
            pageNumber={pageNumber}
            totalPages={totalPages}
            isFetching={isFetching}
            onMobileLoadMore={handleMobileLoadMore}
            mobileCardKeyExtractor={(product) => product.id}
            renderMobileCard={(product) => (
              <ProductMobileCard product={product} onEdit={setEditingProductId} />
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
            }}
          />

          <AddProductDialog
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={async (newProductData) => {
              await addProductMutation.mutateAsync(newProductData);
            }}
            isLoading={addProductMutation.isPending}
          />

          <EditProductDialog
            productId={editingProductId}
            isOpen={Boolean(editingProductId)}
            onClose={() => setEditingProductId(null)}
            onSave={async (updatedProductData) => {
              await editProductMutation.mutateAsync(updatedProductData);
            }}
            isLoading={editProductMutation.isPending}
          />

          <DeleteProductDialog
            isOpen={Boolean(deletingProduct)}
            productName={deletingProduct?.name}
            onClose={() => setDeletingProduct(null)}
            onConfirm={async () => {
              if (deletingProduct) {
                await deleteProductMutation.mutateAsync(deletingProduct.id);
              }
            }}
            isLoading={deleteProductMutation.isPending}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
