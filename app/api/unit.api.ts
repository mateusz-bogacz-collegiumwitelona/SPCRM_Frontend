import { api } from '~/api/api';
import type {
  AddUnitRequestPayload,
  EditUnitRequestPayload,
  PaginatedUnitsResponse,
  UnitListParams,
  UnitOption,
} from '~/types/unit';

export const unitsApi = {
  getList: async (params: UnitListParams): Promise<PaginatedUnitsResponse> => {
    const response = await api.get('/unit', {
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
    const response = await api.post('/unit', payload);
    return response.data;
  },

  edit: async (payload: EditUnitRequestPayload) => {
    const response = await api.put('/unit', payload);
    return response.data;
  },

  getSimpleList: async (): Promise<UnitOption[]> => {
    const res = await api.get('/unit/simple');
    return (res.data?.value || res.data?.data || res.data || []) as UnitOption[];
  },
};
