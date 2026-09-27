import { api } from '~/api/api';
import type {
  AddDealPayload,
  ChangeDealStatusPayload,
  ChangeStatusResponse,
  DealAssignableContactResponse,
  DealProductsParams,
  PaginatedDealProductsResponse,
  PaginatedSalesResponse,
  SaleDetailResponse,
  SalesListParams,
} from '~/types/deal';
import type { AddTaskRequestPayload, DealTasksParams } from '~/types/task';
import type { Note } from '~/types/note';

export const dealsApi = {
  getList: async (params: SalesListParams): Promise<PaginatedSalesResponse> => {
    const response = await api.get('/sales', {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        DateFrom: params.dateFrom,
        DateTo: params.dateTo,
        StatusType: params.statusType || undefined,
        OwnerId: params.ownerId,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  getStatuses: async (): Promise<string[]> => {
    const response = await api.get('/sales/statuses');
    return response.data?.value || response.data?.data || response.data || [];
  },

  getDetails: async (dealId: string): Promise<SaleDetailResponse> => {
    const response = await api.get(`/sales/${dealId}`);
    return response.data?.data || response.data?.value || response.data;
  },

  create: async (payload: AddDealPayload) => {
    const response = await api.post('/sales', payload);
    return response.data;
  },

  addProductToDeal: async (
    dealId: string,
    payload: { productId: string; quantity: number; unitPrice: number },
  ) => {
    const response = await api.put(`/sales/${dealId}/products`, payload);
    return response.data;
  },

  getAssignableContacts: async (dealId: string): Promise<DealAssignableContactResponse[]> => {
    const response = await api.get(`/sales/${dealId}/assignable-contacts`);
    return (response.data?.data || response.data?.value || []) as DealAssignableContactResponse[];
  },

  changeStatus: async (
    dealId: string,
    payload: ChangeDealStatusPayload,
  ): Promise<ChangeStatusResponse> => {
    const response = await api.put(`/sales/${dealId}/status`, payload);
    return (response.data?.data || response.data?.value || response.data) as ChangeStatusResponse;
  },

  editDealProduct: async (
    dealId: string,
    payload: { dealProductId: string; quantity: number; unitPrice: number },
  ) => {
    const response = await api.patch(`/sales/${dealId}/products`, payload);
    return response.data;
  },

  delete: async (dealId: string) => {
    const response = await api.delete(`/sales/${dealId}`);
    return response.data;
  },

  extendCloseDate: async (dealId: string, newCloseDate: string) => {
    const response = await api.put('/sales/extend-close-date', {
      dealId,
      newCloseDate,
    });
    return response.data;
  },

  changeContact: async (dealId: string, newContactId: string) => {
    const response = await api.put(`/sales/${dealId}/contact`, null, {
      params: { contactId: newContactId },
    });
    return response.data;
  },

  getDealProducts: async (
    dealId: string,
    params: DealProductsParams,
  ): Promise<PaginatedDealProductsResponse> => {
    const response = await api.get(`/sales/${dealId}/products`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        ProductCategory: params.productCategory || undefined,
        SteelGrade: params.steelGrade || undefined,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  deleteDealProduct: async (dealId: string, dealProductId: string) => {
    const response = await api.delete(`/sales/${dealId}/products/${dealProductId}`);
    return response.data;
  },

  getDealTasks: async (dealId: string, params: DealTasksParams) => {
    const res = await api.get(`/sales/${dealId}/tasks`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        Status: params.status || undefined,
        Priority: params.priority || undefined,
      },
    });
    return res.data?.value || res.data?.data || res.data;
  },

  addDealTask: async (dealId: string, payload: AddTaskRequestPayload) => {
    const res = await api.post(`/sales/${dealId}/tasks`, payload);
    return res.data;
  },

  getDealNotes: async (dealId: string): Promise<Note[]> => {
    const response = await api.get(`/sales/${dealId}/notes`);
    return response.data?.data || response.data?.value || response.data || [];
  },

  addDealNote: async (dealId: string, payload: { title: string; content: string }) => {
    const response = await api.post(`/sales/${dealId}/notes`, payload);
    return response.data;
  },
};
