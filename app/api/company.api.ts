import { axios } from '~/lib/axios';
import type {
  AddCompanyRequest,
  CompanyAddress,
  CompanyAddressFormData,
  CompanyDetailResponse,
  CompanyListParams,
  Debt,
  DebtSummary,
  EditCompanyDetailResponse,
  EditCompanyRequest,
  GetCompanyResponse,
} from '~/types/company';
import type { PaginatedResponse } from '~/types/table';
import type { CompanySaleItem } from '~/types/deal';

export const companyApi = {
  getList: async (params: CompanyListParams): Promise<PaginatedResponse<GetCompanyResponse>> => {
    const response = await axios.get('/company/list', {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        CreatedAtFrom: params.createdAtFrom || undefined,
        CreatedAtTo: params.createdAtTo || undefined,
        IsYour: params.isYour,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  create: async (payload: AddCompanyRequest) => {
    const response = await axios.post('/company', payload);
    return response.data;
  },

  getDetails: async (companyId: string): Promise<CompanyDetailResponse> => {
    const response = await axios.get('/company', { params: { companyId } });
    return response.data.data;
  },

  getEditDetails: async (companyId: string): Promise<EditCompanyDetailResponse> => {
    const response = await axios.get(`/company/edit-detail/${companyId}`);
    return response.data?.data ?? response.data;
  },

  getAddresses: async (companyId: string): Promise<PaginatedResponse<CompanyAddress>> => {
    const response = await axios.get('/company/addresses', {
      params: { companyId, PageNumber: 1, PageSize: 100 },
    });
    return response.data.data;
  },

  getAddressTypes: async (): Promise<string[]> => {
    const response = await axios.get('/company/address/types');
    return (response.data?.data || response.data?.value || []) as string[];
  },

  edit: async (payload: EditCompanyRequest) => {
    const response = await axios.patch('/company', payload);
    return response.data;
  },

  saveAddress: async (companyId: string, formData: CompanyAddressFormData) => {
    if (formData.addressId) {
      const response = await axios.patch('/company/address', formData);
      return response.data;
    }

    const response = await axios.post(`/company/address/${companyId}`, {
      street: formData.street,
      city: formData.city,
      zipCode: formData.zipCode,
      longitude: formData.longitude,
      latitude: formData.latitude,
      type: formData.type,
    });
    return response.data;
  },

  deleteAddress: async (addressId: string) => {
    const response = await axios.delete(`/company/address/${addressId}`);
    return response.data;
  },

  deleteCompany: async (companyId: string) => {
    const response = await axios.delete(`/company/${companyId}`);
    return response.data;
  },

  changeOwner: async (companyId: string, newOwnerId: string) => {
    const response = await axios.patch('/company/change-owner', {
      companyId,
      userId: newOwnerId,
    });
    return response.data;
  },

  getContacts: async (params: { companyId: string; pageNumber: number; pageSize: number }) => {
    const response = await axios.get('/company/contacts', {
      params: {
        companyId: params.companyId,
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
      },
    });
    return response.data?.data || response.data;
  },

  getDebtSummary: async (companyId: string): Promise<DebtSummary[]> => {
    const response = await axios.get('/company/debts/summary', {
      params: { CompanyId: companyId },
    });
    return response.data?.data || response.data?.value || [];
  },

  getDebts: async (params: {
    companyId: string;
    pageNumber: number;
    pageSize: number;
  }): Promise<PaginatedResponse<Debt>> => {
    const response = await axios.get('/company/debts', {
      params: {
        CompanyId: params.companyId,
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
      },
    });
    return response.data?.data || response.data?.value || null;
  },

  getSales: async (params: {
    companyId: string;
    pageNumber: number;
    pageSize: number;
  }): Promise<PaginatedResponse<CompanySaleItem>> => {
    const response = await axios.get('/company/sales', {
      params: {
        companyId: params.companyId,
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
      },
    });
    return response.data?.data || response.data;
  },
};
