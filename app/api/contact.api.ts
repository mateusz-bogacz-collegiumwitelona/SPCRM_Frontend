import type {
  AddContactRequest,
  Contact,
  ContactListParams,
  EditContactRequest,
  OwnerOption,
  PagedContactsToDealResult,
  PaginatedContactsResponse,
} from '~/interfaces/contact';
import type { AddTaskRequestPayload } from '~/interfaces/task';
import { api } from '~/api/api';

export const contactsApi = {
  getList: async (params: ContactListParams): Promise<PaginatedContactsResponse> => {
    const response = await api.get('/contacts', {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        CompanyName: params.companyName || undefined,
        IsPrimary: params.isPrimary,
        OwnerId: params.ownerId,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  getCompanies: async (): Promise<string[]> => {
    const response = await api.get('/contacts/companies');
    return response.data?.value || response.data?.data || response.data || [];
  },

  getAvailableOwners: async (): Promise<OwnerOption[]> => {
    const response = await api.get('/contacts/available-owners');
    return response.data?.data || [];
  },

  getDetails: async (contactId: string) => {
    const response = await api.get(`/contacts/${contactId}`);
    return response.data.data;
  },

  getEditDetails: async (contactId: string) => {
    const response = await api.get(`/contacts/${contactId}/detail`);
    return response.data.data;
  },

  getWays: async (contactId: string): Promise<Contact[]> => {
    const response = await api.get(`/contacts/${contactId}/ways`);
    return response.data?.data || [];
  },

  getTypes: async (): Promise<string[]> => {
    const response = await api.get('/contacts/types');
    return response.data?.data || [];
  },

  edit: async (payload: EditContactRequest) => {
    const response = await api.patch('/contacts/edit', payload);
    return response.data;
  },

  setPrimary: async (contactId: string) => {
    const response = await api.patch(`/contacts/${contactId}/set-primary`);
    return response.data;
  },

  changeOwner: async (payload: { contactId: string; newOwnerId: string }) => {
    const response = await api.patch('/contacts/change-owner', payload);
    return response.data;
  },

  create: async (payload: AddContactRequest) => {
    const response = await api.post('/contacts', payload);
    return response.data;
  },

  delete: async (contactId: string) => {
    const response = await api.delete(`/contacts/${contactId}`);
    return response.data;
  },

  getToDeals: async (params: {
    pageNumber: number;
    pageSize: number;
    searchTerm?: string;
  }): Promise<PagedContactsToDealResult> => {
    const res = await api.get('/contacts/to-deals', {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
      },
    });
    return res.data?.data || res.data?.value || res.data;
  },

  getContactTasks: async (
    contactId: string,
    params: { pageNumber: number; pageSize: number; searchTerm?: string },
  ) => {
    const res = await api.get(`/contacts/${contactId}/tasks`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
      },
    });
    return res.data?.value || res.data?.data || res.data;
  },

  addContactTask: async (contactId: string, payload: AddTaskRequestPayload) => {
    const res = await api.post(`/contacts/${contactId}/tasks`, payload);
    return res.data;
  },
};
