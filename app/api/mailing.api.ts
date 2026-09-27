import { axios } from '~/lib/axios';
import type {
  MailingClientResponse,
  MailingProductResponse,
  SendMailingPayload,
} from '~/types/mailing';

export const mailingApi = {
  getContacts: async (
    searchTermOrParams?: string | { searchTerm?: string; pageSize?: number },
  ): Promise<MailingClientResponse[]> => {
    const searchTerm =
      typeof searchTermOrParams === 'string' ? searchTermOrParams : searchTermOrParams?.searchTerm;
    const pageSize =
      typeof searchTermOrParams === 'object' && searchTermOrParams?.pageSize
        ? searchTermOrParams.pageSize
        : 50;

    const response = await axios.get('/mailing/contacts', {
      params: { SearchTerm: searchTerm || undefined, PageSize: pageSize },
    });
    return response.data?.data?.items || response.data?.items || [];
  },

  getProducts: async (searchTerm?: string): Promise<MailingProductResponse[]> => {
    const response = await axios.get('/mailing/products', {
      params: { SearchTerm: searchTerm || undefined, PageSize: 50 },
    });
    return response.data?.data?.items || response.data?.items || [];
  },

  sendMailing: async (payload: SendMailingPayload) => {
    const response = await axios.post('/mailing/offert', payload);
    return response.data;
  },
};
