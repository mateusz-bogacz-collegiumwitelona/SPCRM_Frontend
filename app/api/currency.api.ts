import { client } from '~/lib/client';
import type {
  AddCurrencyRequestPayload,
  CurrencyListParams,
  CurrencySimple,
  EditCurrencyRequestPayload,
} from '~/types/currency';
import type { PaginatedResponse } from '~/types/table';

export const currenciesApi = {
  getList: async (params: CurrencyListParams): Promise<PaginatedResponse<CurrencySimple>> => {
    const response = await client.get('/currency', {
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
    const response = await client.post('/currency', payload);
    return response.data;
  },

  edit: async (payload: EditCurrencyRequestPayload) => {
    const response = await client.patch('/currency', payload);
    return response.data;
  },

  getSimpleList: async (): Promise<CurrencySimple[]> => {
    const res = await client.get('/currency/simple');
    return res.data?.data || res.data?.value || res.data || [];
  },
};
