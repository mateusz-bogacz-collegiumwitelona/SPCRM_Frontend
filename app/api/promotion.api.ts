import { api } from '~/api/api';
import type {
  AddPromotionRequest,
  EditPromotionRequest,
  PromotionDetailResponse,
  PromotionListParams,
  PromotionResponse,
} from '~/types/promotion';
import type { PaginatedResponse } from '~/types/table';

export const promotionsApi = {
  getList: async (params: PromotionListParams): Promise<PaginatedResponse<PromotionResponse>> => {
    const response = await api.get('/promotion', {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        IsActive: params.isActive,
        FromDate: params.fromDate,
        ToDate: params.toDate,
        DiscountPercentageFrom: params.discountPercentageFrom,
        DiscountPercentageTo: params.discountPercentageTo,
        PromotionPriceFrom: params.promotionPriceFrom,
        PromotionPriceTo: params.promotionPriceTo,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  create: async (payload: AddPromotionRequest): Promise<string> => {
    const response = await api.post('/promotion', payload);
    return response.data?.data;
  },

  getDetails: async (promotionId: string): Promise<PromotionDetailResponse> => {
    const response = await api.get(`/promotion/${promotionId}`);
    return response.data?.data || response.data?.value || response.data;
  },

  deactivate: async (promotionId: string) => {
    const response = await api.patch(`/promotion/${promotionId}/deactivate`);
    return response.data;
  },

  activate: async (promotionId: string, endDate: string) => {
    const response = await api.patch('/promotion/activate', {
      id: promotionId,
      endDate,
    });
    return response.data;
  },

  edit: async (payload: EditPromotionRequest) => {
    const response = await api.patch('/promotion/edit', payload);
    return response.data;
  },

  delete: async (promotionId: string) => {
    const response = await api.delete(`/promotion/${promotionId}`);
    return response.data;
  },
};
