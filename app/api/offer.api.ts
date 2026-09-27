import { axios } from '~/lib/axios';
import type {
  CompanySimpleListResponse,
  OfferAllowedActionsResponse,
  OfferClientDetailResponse,
  OfferListParams,
  OfferListResponse,
  OfferProductResponse,
  OfferProductsParams,
  UpdateOfferProductItem,
} from '~/types/offer';
import type { PaginatedResponse } from '~/types/table';

export const offersApi = {
  getList: async (params: OfferListParams): Promise<PaginatedResponse<OfferListResponse>> => {
    const response = await axios.get('/offer', {
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
    const response = await axios.get('/offer/statuses');
    return response.data?.data || response.data?.value || response.data || [];
  },

  getCompaniesSimpleList: async (): Promise<CompanySimpleListResponse[]> => {
    const response = await axios.get('/company/simple-list');
    return response.data?.value || response.data?.data || response.data || [];
  },

  getDetails: async (offerId: string) => {
    const response = await axios.get(`/offer/detail/${offerId}`);
    return response.data.data;
  },

  getAllowedActions: async (offerId: string): Promise<OfferAllowedActionsResponse> => {
    const response = await axios.get(`/offer/${offerId}/allowed-actions`);
    return response.data?.data || response.data?.value || response.data;
  },

  getClientDetail: async (offerId: string): Promise<OfferClientDetailResponse> => {
    const response = await axios.get(`/offer/client/${offerId}`);
    return response.data?.data || response.data?.value || response.data;
  },

  getOfferProducts: async (
    offerId: string,
    params: OfferProductsParams,
  ): Promise<PaginatedResponse<OfferProductResponse>> => {
    const response = await axios.get(`/offer/product/${offerId}`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  updateProducts: async (offerId: string, items: UpdateOfferProductItem[]) => {
    const response = await axios.put('/offer/products', { offerId, items });
    return response.data;
  },

  extendValidity: async (offerId: string, newValidUntil?: string) => {
    const response = await axios.patch('/offer/extend', { offerId, newValidUntil });
    return response.data;
  },

  changeStatus: async (offerId: string, newStatus: 'Accepted' | 'Rejected') => {
    const response = await axios.patch('/offer/change-status', { offerId, newStatus });
    return response.data;
  },

  resendEmail: async (offerId: string, language: string) => {
    const response = await axios.post('/offer/resend-email', { offerId, language });
    return response.data;
  },

  delete: async (offerId: string) => {
    const response = await axios.delete(`/offer/${offerId}`);
    return response.data;
  },
};
