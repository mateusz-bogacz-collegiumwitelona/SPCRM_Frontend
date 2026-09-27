import { axios } from '~/lib/axios';
import type {
  AddCurrencyRequestPayload,
  CurrencyListParams,
  CurrencySimple,
  EditCurrencyRequestPayload,
} from '~/types/currency';
import type { PaginatedResponse } from '~/types/table';

export const currenciesApi = {
  getList: async (params: CurrencyListParams): Promise<PaginatedResponse<CurrencySimple>> => {
    const response = await axios.get('/currency', {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  create: async (payload: AddCurrencyRequestPayload) => {
    const response = await axios.post('/currency', payload);
    return response.data;
  },

  edit: async (payload: EditCurrencyRequestPayload) => {
    const response = await axios.patch('/currency', payload);
    return response.data;
  },

  getSimpleList: async (): Promise<CurrencySimple[]> => {
    const res = await axios.get('/currency/simple');
    return res.data?.data || res.data?.value || res.data || [];
  },
};
