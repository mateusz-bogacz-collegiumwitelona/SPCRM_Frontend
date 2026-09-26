import { api } from '~/api/api';
import type {
  AddInvoicePaymentPayload,
  InvoiceDetailResponse,
  InvoiceListParams,
  InvoicePaymentListResponse,
  InvoicePaymentSummaryResponse,
  InvoiceProductsListResponse,
  PaginatedInvoicesResponse,
} from '~/interfaces/invoice';
import type { PdfFilePayload } from '~/interfaces/pdf';

export interface InvoicePaymentsParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
}

export interface PaginatedInvoicePaymentsResponse {
  items: InvoicePaymentListResponse[];
  totalPages: number;
  totalCount?: number;
  totalItems?: number;
}

export interface InvoiceProductsParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
}

export interface PaginatedInvoiceProductsResponse {
  items: InvoiceProductsListResponse[];
  totalPages: number;
  totalCount?: number;
  totalItems?: number;
}

export const invoiceApi = {
  getList: async (params: InvoiceListParams): Promise<PaginatedInvoicesResponse> => {
    const response = await api.get('/invoice', {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        CompanyName: params.companyName?.trim() || undefined,
        CompanyNip: params.companyNip?.trim() || undefined,
        IssueDateFrom: params.issueDateFrom,
        IssueDateTo: params.issueDateTo,
        IsOverDue: params.isOverDue,
        TotalAmountFrom: params.totalAmountFrom,
        TotalAmountTo: params.totalAmountTo,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  getDetails: async (invoiceId: string): Promise<InvoiceDetailResponse> => {
    const response = await api.get(`/invoice/${invoiceId}`);
    return response.data?.data || response.data?.value || response.data;
  },

  getPaymentSummary: async (invoiceId: string): Promise<InvoicePaymentSummaryResponse> => {
    const response = await api.get(`/invoice/${invoiceId}/payment/summary`);
    return response.data?.data || response.data?.value || response.data;
  },

  addPayment: async (invoiceId: string, payload: AddInvoicePaymentPayload) => {
    const response = await api.post(`/invoice/${invoiceId}/payment`, payload);
    return response.data;
  },

  getInvoicePdf: async (invoiceId: string, language: 'pl' | 'en'): Promise<PdfFilePayload> => {
    const response = await api.get(`/invoice/${invoiceId}/pdf`, {
      params: { language },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  getPayments: async (
    invoiceId: string,
    params: InvoicePaymentsParams,
  ): Promise<PaginatedInvoicePaymentsResponse> => {
    const response = await api.get(`/invoice/${invoiceId}/payment`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  getProducts: async (
    invoiceId: string,
    params: InvoiceProductsParams,
  ): Promise<PaginatedInvoiceProductsResponse> => {
    const response = await api.get(`/invoice/${invoiceId}/products`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },
};
