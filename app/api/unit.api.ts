import { axios } from '~/lib/axios';
import type {
  AddUnitRequestPayload,
  EditUnitRequestPayload,
  UnitListParams,
  UnitListResponse,
  UnitOption,
} from '~/types/unit';
import type { PaginatedResponse } from '~/types/table';

export const unitsApi = {
  getList: async (params: UnitListParams): Promise<PaginatedResponse<UnitListResponse>> => {
    const response = await axios.get('/unit', {
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

  create: async (payload: AddUnitRequestPayload) => {
    const response = await axios.post('/unit', payload);
    return response.data;
  },

  edit: async (payload: EditUnitRequestPayload) => {
    const response = await axios.put('/unit', payload);
    return response.data;
  },

  getSimpleList: async (): Promise<UnitOption[]> => {
    const res = await axios.get('/unit/simple');
    return (res.data?.value || res.data?.data || res.data || []) as UnitOption[];
  },
};
