import { client } from '~/lib/client';
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
    const response = await client.get('/steel-grade', {
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
    const res = await client.get(`/steel-grade/${steelGradeId}/products`);
    return (res.data?.value || res.data?.data || res.data || []) as SteelGradeProductItem[];
  },

  create: async (payload: AddSteelGradePayload) => {
    const response = await client.post('/steel-grade', payload);
    return response.data;
  },

  edit: async (payload: EditSteelGradePayload) => {
    const response = await client.patch('/steel-grade', payload);
    return response.data;
  },

  delete: async ({ id, reassignments }: DeleteSteelGradeParams) => {
    const response = await client.delete(`/steel-grade/${id}`, {
      data: { reassignments },
    });
    return response.data;
  },
};
