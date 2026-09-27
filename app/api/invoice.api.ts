import { axios } from '~/lib/axios';
import type {
  AddInvoicePaymentPayload,
  InvoiceDetailResponse,
  InvoiceListParams,
  InvoiceListResponse,
  InvoicePaymentListResponse,
  InvoicePaymentSummaryResponse,
  InvoiceProductsListResponse,
} from '~/types/invoice';
import type { PdfFilePayload } from '~/types/pdf';
import type {
  InvoicePaymentsParams,
  InvoiceProductsParams,
  PaginatedResponse,
} from '~/types/table';

export const invoiceApi = {
  getList: async (params: InvoiceListParams): Promise<PaginatedResponse<InvoiceListResponse>> => {
    const response = await axios.get('/invoice', {
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
    const response = await axios.get(`/invoice/${invoiceId}`);
    return response.data?.data || response.data?.value || response.data;
  },

  getPaymentSummary: async (invoiceId: string): Promise<InvoicePaymentSummaryResponse> => {
    const response = await axios.get(`/invoice/${invoiceId}/payment/summary`);
    return response.data?.data || response.data?.value || response.data;
  },

  addPayment: async (invoiceId: string, payload: AddInvoicePaymentPayload) => {
    const response = await axios.post(`/invoice/${invoiceId}/payment`, payload);
    return response.data;
  },

  getInvoicePdf: async (invoiceId: string, language: 'pl' | 'en'): Promise<PdfFilePayload> => {
    const response = await axios.get(`/invoice/${invoiceId}/pdf`, {
      params: { language },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  getPayments: async (
    invoiceId: string,
    params: InvoicePaymentsParams,
  ): Promise<PaginatedResponse<InvoicePaymentListResponse>> => {
    const response = await axios.get(`/invoice/${invoiceId}/payment`, {
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
  ): Promise<PaginatedResponse<InvoiceProductsListResponse>> => {
    const response = await axios.get(`/invoice/${invoiceId}/products`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },
};
