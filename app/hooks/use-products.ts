import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '~/api/product.api';
import type {
  AddProductRequest,
  EditProductRequest,
  ProductInvoicesParams,
  ProductListParams,
} from '~/interfaces/product';

export const productKeys = {
  all: ['products'] as const,
  list: (params: Record<string, unknown>) => [...productKeys.all, 'list', params] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  steelGrades: () => [...productKeys.all, 'steel-grades'] as const,
  details: (id?: string) => ['product-details', id] as const,
  forEdit: (id?: string) => ['product-for-edit', id] as const,
  search: (query: string) => ['products-async-search', query] as const,
  invoices: (productId?: string, params?: Record<string, unknown>) =>
    ['product-invoices', productId, params] as const,
};

interface UseProductsListProps {
  pageNumber: number;
  pageSize: number;
  debouncedSearch: string;
  sortBy: string;
  sortDescending: boolean;
  productFilter: string;
  steelGradeFilter: string;
  hasActivePromotion: boolean;
}

export function useProductsList({
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
  productFilter,
  steelGradeFilter,
  hasActivePromotion,
}: UseProductsListProps) {
  const queryParams: ProductListParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy,
    sortDescending,
    category: productFilter,
    steelGrade: steelGradeFilter,
    hasActivePromotion,
  };

  return useQuery({
    queryKey: productKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: () => productsApi.getList(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: productsApi.getCategories,
    staleTime: Infinity,
  });
}

export function useProductSteelGrades() {
  return useQuery({
    queryKey: productKeys.steelGrades(),
    queryFn: productsApi.getSteelGrades,
    staleTime: Infinity,
  });
}

export function useProductDetails(productId?: string) {
  return useQuery({
    queryKey: productKeys.details(productId),
    queryFn: () => productsApi.getDetails(productId || ''),
    enabled: Boolean(productId),
    retry: false,
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();

  const invalidateProductLists = async () => {
    await queryClient.invalidateQueries({ queryKey: productKeys.all });
  };

  const addProductMutation = useMutation({
    mutationFn: (newProduct: AddProductRequest) => productsApi.create(newProduct),
    onSuccess: invalidateProductLists,
  });

  const editProductMutation = useMutation({
    mutationFn: (updatedProduct: EditProductRequest) => productsApi.edit(updatedProduct),
    onSuccess: async (_, variables) => {
      await invalidateProductLists();
      await queryClient.invalidateQueries({ queryKey: productKeys.details(variables.productId) });
      await queryClient.invalidateQueries({ queryKey: productKeys.forEdit(variables.productId) });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => productsApi.delete(productId),
    onSuccess: invalidateProductLists,
  });

  const addStockMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      productsApi.addStock(productId, quantity),
    onSuccess: invalidateProductLists,
  });

  return {
    addProductMutation,
    editProductMutation,
    deleteProductMutation,
    addStockMutation,
  };
}

export function useProductSearch(query: string, enabled = true, limit = 20) {
  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: () => productsApi.search(query, limit),
    enabled: enabled && query.length >= 2,
  });
}

export function useProductEditDetails(productId?: string | null, enabled = true) {
  return useQuery({
    queryKey: productKeys.forEdit(productId || undefined),
    queryFn: () => productsApi.getEditDetails(productId || ''),
    enabled: Boolean(productId) && enabled,
  });
}
interface UseProductInvoicesProps {
  productId: string;
  pageNumber: number;
  pageSize: number;
  debouncedSearch?: string;
}

export function useProductInvoices({
  productId,
  pageNumber,
  pageSize,
  debouncedSearch,
}: UseProductInvoicesProps) {
  const queryParams: ProductInvoicesParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
  };

  return useQuery({
    queryKey: productKeys.invoices(productId, queryParams as unknown as Record<string, unknown>),
    queryFn: () => productsApi.getInvoices(productId, queryParams),
    placeholderData: keepPreviousData,
    enabled: Boolean(productId),
  });
}
