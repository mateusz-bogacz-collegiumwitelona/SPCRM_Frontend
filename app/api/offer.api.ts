import { api } from '~/api/api';
import type {
  CompanySimpleListResponse,
  OfferAllowedActionsResponse,
  OfferClientDetailResponse,
  OfferListParams,
  OfferProductsParams,
  PaginatedOfferProductsResponse,
  PaginatedOffersResponse,
  UpdateOfferProductItem,
} from '~/types/offer';

export const offersApi = {
  getList: async (params: OfferListParams): Promise<PaginatedOffersResponse> => {
    const response = await api.get('/offer', {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        Status: params.status || undefined,
        CompanyName: params.companyName || undefined,
        IsExpired: params.isExpired,
        ValidUntilFrom: params.validUntilFrom,
        ValidUntilTo: params.validUntilTo,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  getStatuses: async (): Promise<string[]> => {
    const response = await api.get('/offer/statuses');
    return response.data?.data || response.data?.value || response.data || [];
  },

  getCompaniesSimpleList: async (): Promise<CompanySimpleListResponse[]> => {
    const response = await api.get('/company/simple-list');
    return response.data?.value || response.data?.data || response.data || [];
  },

  getDetails: async (offerId: string) => {
    const response = await api.get(`offer/detail/${offerId}`);
    return response.data.data;
  },

  getAllowedActions: async (offerId: string): Promise<OfferAllowedActionsResponse> => {
    const response = await api.get(`/offer/${offerId}/allowed-actions`);
    return response.data?.data || response.data?.value || response.data;
  },

  getClientDetail: async (offerId: string): Promise<OfferClientDetailResponse> => {
    const response = await api.get(`/offer/client/${offerId}`);
    return response.data?.data || response.data?.value || response.data;
  },

  getOfferProducts: async (
    offerId: string,
    params: OfferProductsParams,
  ): Promise<PaginatedOfferProductsResponse> => {
    const response = await api.get(`/offer/product/${offerId}`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  updateProducts: async (offerId: string, items: UpdateOfferProductItem[]) => {
    const response = await api.put('/offer/products', { offerId, items });
    return response.data;
  },

  extendValidity: async (offerId: string, newValidUntil?: string) => {
    const response = await api.patch('/offer/extend', { offerId, newValidUntil });
    return response.data;
  },

  changeStatus: async (offerId: string, newStatus: 'Accepted' | 'Rejected') => {
    const response = await api.patch('/offer/change-status', { offerId, newStatus });
    return response.data;
  },

  resendEmail: async (offerId: string, language: string) => {
    const response = await api.post('/offer/resend-email', { offerId, language });
    return response.data;
  },

  delete: async (offerId: string) => {
    const response = await api.delete(`/offer/${offerId}`);
    return response.data;
  },
};
