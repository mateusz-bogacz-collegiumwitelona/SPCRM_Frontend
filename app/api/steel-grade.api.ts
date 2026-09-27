import { axios } from '~/lib/axios';
import type {
  AddSteelGradePayload,
  DeleteSteelGradeParams,
  EditSteelGradePayload,
  SteelGradeListParams,
  SteelGradeListResponse,
  SteelGradeProductItem,
} from '~/types/steel-grade';
import type { PaginatedResponse } from '~/types/table';

export const steelGradesApi = {
  getList: async (
    params: SteelGradeListParams,
  ): Promise<PaginatedResponse<SteelGradeListResponse>> => {
    const response = await axios.get('/steel-grade', {
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

  getProducts: async (steelGradeId: string): Promise<SteelGradeProductItem[]> => {
    const res = await axios.get(`/steel-grade/${steelGradeId}/products`);
    return (res.data?.value || res.data?.data || res.data || []) as SteelGradeProductItem[];
  },

  create: async (payload: AddSteelGradePayload) => {
    const response = await axios.post('/steel-grade', payload);
    return response.data;
  },

  edit: async (payload: EditSteelGradePayload) => {
    const response = await axios.patch('/steel-grade', payload);
    return response.data;
  },

  delete: async ({ id, reassignments }: DeleteSteelGradeParams) => {
    const response = await axios.delete(`/steel-grade/${id}`, {
      data: { reassignments },
    });
    return response.data;
  },
};
