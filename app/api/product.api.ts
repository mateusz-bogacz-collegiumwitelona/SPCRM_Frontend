import { api } from '~/api/api';
import type {
  AddProductRequest,
  AddProductStockRequest,
  EditProductDetailResponse,
  EditProductRequest,
  PaginatedProductInvoicesResponse,
  PaginatedProductsResponse,
  ProductInvoicesParams,
  ProductListParams,
  ProductSearchResult,
  SteelGradeResponse,
} from '~/interfaces/product';

export const productsApi = {
  getList: async (params: ProductListParams): Promise<PaginatedProductsResponse> => {
    const response = await api.get('/products', {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        ProductCategory: params.category || undefined,
        SteelGrade: params.steelGrade || undefined,
        HasActivePromotion: params.hasActivePromotion ? true : undefined,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/products/categories');
    return response.data?.value || response.data?.data || response.data || [];
  },

  getSteelGrades: async (): Promise<SteelGradeResponse[]> => {
    const response = await api.get('/products/steel-grades');
    return response.data?.value || response.data?.data || response.data || [];
  },

  getDetails: async (productId: string) => {
    const response = await api.get(`/products/${productId}`);
    return response.data?.value || response.data?.data || response.data;
  },

  getEditDetails: async (productId: string): Promise<EditProductDetailResponse> => {
    const res = await api.get(`/products/edit/${productId}`);
    return (res.data?.value || res.data?.data || res.data) as EditProductDetailResponse;
  },

  search: async (query: string, limit = 20): Promise<ProductSearchResult[]> => {
    if (!query) return [];
    const response = await api.get('/products/search', {
      params: { Query: query, Limit: limit },
    });
    return response.data?.data || response.data?.value || response.data || [];
  },

  create: async (payload: AddProductRequest) => {
    const response = await api.post('/products', payload);
    return response.data;
  },

  edit: async (payload: EditProductRequest) => {
    const response = await api.put(`/products/${payload.productId}`, payload);
    return response.data;
  },

  delete: async (productId: string) => {
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  },

  addStock: async (productId: string, quantityToAdd: number) => {
    const payload: AddProductStockRequest = { quantityToAdd };
    const response = await api.post(`/products/${productId}/stock`, payload);
    return response.data;
  },

  getInvoices: async (
    productId: string,
    params: ProductInvoicesParams,
  ): Promise<PaginatedProductInvoicesResponse> => {
    const response = await api.get(`/products/${productId}/invoices`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },
};
