import type {
  AddContactRequest,
  Contact,
  ContactListParams,
  ContactResponse,
  EditContactRequest,
  OwnerOption,
} from '~/types/contact';
import type { AddTaskRequestPayload } from '~/types/task';
import { client } from '~/lib/client';
import type { PaginatedResponse } from '~/types/table';
import type { ContactDealResponse } from '~/types/deal';

export const contactsApi = {
  getList: async (params: ContactListParams): Promise<PaginatedResponse<ContactResponse>> => {
    const response = await client.get('/contacts', {
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
    const response = await client.get('/contacts/companies');
    return response.data?.value || response.data?.data || response.data || [];
  },

  getAvailableOwners: async (): Promise<OwnerOption[]> => {
    const response = await client.get('/contacts/available-owners');
    return response.data?.data || [];
  },

  getDetails: async (contactId: string) => {
    const response = await client.get(`/contacts/${contactId}`);
    return response.data.data;
  },

  getEditDetails: async (contactId: string) => {
    const response = await client.get(`/contacts/${contactId}/detail`);
    return response.data.data;
  },

  getWays: async (contactId: string): Promise<Contact[]> => {
    const response = await client.get(`/contacts/${contactId}/ways`);
    return response.data?.data || [];
  },

  getTypes: async (): Promise<string[]> => {
    const response = await client.get('/contacts/types');
    return response.data?.data || [];
  },

  edit: async (payload: EditContactRequest) => {
    const response = await client.patch('/contacts/edit', payload);
    return response.data;
  },

  setPrimary: async (contactId: string) => {
    const response = await client.patch(`/contacts/${contactId}/set-primary`);
    return response.data;
  },

  changeOwner: async (payload: { contactId: string; newOwnerId: string }) => {
    const response = await client.patch('/contacts/change-owner', payload);
    return response.data;
  },

  create: async (payload: AddContactRequest) => {
    const response = await client.post('/contacts', payload);
    return response.data;
  },

  delete: async (contactId: string) => {
    const response = await client.delete(`/contacts/${contactId}`);
    return response.data;
  },

  getToDeals: async (params: {
    pageNumber: number;
    pageSize: number;
    searchTerm?: string;
  }): Promise<PaginatedResponse<ContactDealResponse>> => {
    const res = await client.get('/contacts/to-deals', {
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
    const res = await client.get(`/contacts/${contactId}/tasks`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
      },
    });
    return res.data?.value || res.data?.data || res.data;
  },

  addContactTask: async (contactId: string, payload: AddTaskRequestPayload) => {
    const res = await client.post(`/contacts/${contactId}/tasks`, payload);
    return res.data;
  },
};
