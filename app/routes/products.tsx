import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Link } from 'react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Plus,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { MainLayout } from '~/components/layout/main-layout';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { AddProductDialog, type AddProductRequest } from '~/components/products/add-product-dialog';

interface ProductResonse {
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

const columnHelper = createColumnHelper<ProductResonse>();

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
      return (
        <Link
          to={`/products/${info.row.original.id}`}
          className="font-medium text-blue-900 hover:underline"
        >
          Szczegóły
        </Link>
      );
    },
  }),
];

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

  const [accumulatedMobileProducts, setAccumulatedMobileProducts] = useState<ProductResonse[]>([]);
  const isMobileAppend = useRef(false);

  const [hasActivePromotion, setHasActivePromotion] = useState<boolean>(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const addProductMutation = useMutation({
    mutationFn: async (newProduct: AddProductRequest) => {
      await api.post('/products', newProduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      setIsAddModalOpen(false);
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
    if (!data?.items) return;

    setAccumulatedMobileProducts((prev) => {
      if (pageNumber === 1) return data.items;

      if (isMobileAppend.current) {
        const newItems = data.items.filter(
          (newItem: ProductResonse) => !prev.some((p) => p.id === newItem.id),
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
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6 flex justify-between items-center">
            <h1 className="text-lg lg:text-2xl font-semibold flex items-center gap-2">Produkty</h1>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white text-blue-900 hover:bg-gray-100 font-medium text-xs sm:text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Dodaj produkt
            </Button>
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
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full sm:w-auto flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filtry</span>
                    {(productFilter || steelGradeFilter || hasActivePromotion) && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-900"></span>
                      </span>
                    )}
                  </Button>

                  {showFilters && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Filtruj asortyment</h3>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Kategoria
                          </label>
                          <select
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
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Gatunek stali
                          </label>
                          <select
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

          {errorMessage && (
            <div className="mb-6 flex items-center gap-2 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-blue-900 mb-4" />
              <p className="text-gray-500 font-medium">Ładowanie produktów...</p>
            </div>
          ) : desktopProducts.length === 0 && !isError ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
              <p className="text-gray-500 font-medium">Brak produktów do wyświetlenia.</p>
            </div>
          ) : (
            <>
              <div className="block lg:hidden space-y-4">
                {accumulatedMobileProducts.map((product) => {
                  return (
                    <div
                      key={product.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2">
                        <p className="text-sm font-bold text-blue-900">{product.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Wymiary: {product.dimensions}</p>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
                        <div className="text-gray-600">
                          Ilość: {product.stockQuantity} {product.unitSymbol}
                        </div>
                        <Link
                          to={`/products/${product.id}`}
                          className="text-xs font-medium text-blue-900 hover:underline"
                        >
                          Detale
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {pageNumber < totalPages && (
                  <div className="mt-6 flex justify-center pzt-2">
                    <Button
                      onClick={handleMobileLoadMore}
                      disabled={isFetching}
                      className="w-full bg-blue-900 text-white hover:bg-blue-800 transition-all flex items-center justify-center gap-2 h-11"
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Wczytywanie danych...
                        </>
                      ) : (
                        'Pokaż więcej wyników'
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="hidden lg:block space-y-4">
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="border-b border-gray-200 px-6 py-4 text-left text-sm font-semibold text-gray-900"
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
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
                            <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Pozycji na stronie:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:ring-blue-900 text-gray-700 shadow-sm"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="text-sm text-gray-500">
                    Wyświetlanie {Math.min((pageNumber - 1) * pageSize + 1, totalItems)} do{' '}
                    {Math.min(pageNumber * pageSize, totalItems)} z {totalItems} wyników
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleDesktopPageChange(Math.max(pageNumber - 1, 1))}
                      disabled={pageNumber === 1 || isFetching}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-blue-900 border-gray-300 hover:bg-gray-50 disabled:opacity-40"
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
                      className="h-9 w-9 text-blue-900 border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          <AddProductDialog
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={async (data) => {
              await addProductMutation.mutateAsync(data);
            }}
            isLoading={addProductMutation.isPending}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
