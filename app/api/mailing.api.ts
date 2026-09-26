import { api } from '~/api/api';
import type {
  Currency,
  MailingClientResponse,
  MailingProductResponse,
  SendMailingPayload,
} from '~/interfaces/mailing';

export const mailingApi = {
  getCurrencies: async (): Promise<Currency[]> => {
    const response = await api.get('/currency/simple');
    return response.data?.data || response.data || [];
  },

  getContacts: async (
    searchTermOrParams?: string | { searchTerm?: string; pageSize?: number },
  ): Promise<MailingClientResponse[]> => {
    const searchTerm =
      typeof searchTermOrParams === 'string' ? searchTermOrParams : searchTermOrParams?.searchTerm;
    const pageSize =
      typeof searchTermOrParams === 'object' && searchTermOrParams?.pageSize
        ? searchTermOrParams.pageSize
        : 50;

    const response = await api.get('/mailing/contacts', {
      params: { SearchTerm: searchTerm || undefined, PageSize: pageSize },
    });
    return response.data?.data?.items || response.data?.items || [];
  },

  getProducts: async (searchTerm?: string): Promise<MailingProductResponse[]> => {
    const response = await api.get('/mailing/products', {
      params: { SearchTerm: searchTerm || undefined, PageSize: 50 },
    });
    return response.data?.data?.items || response.data?.items || [];
  },

  sendMailing: async (payload: SendMailingPayload) => {
    const response = await api.post('/mailing/offert', payload);
    return response.data;
  },
};
