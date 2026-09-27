import { api } from '~/api/api';
import type {
  AddSteelGradePayload,
  DeleteSteelGradeParams,
  EditSteelGradePayload,
  PaginatedSteelGradesResponse,
  SteelGradeListParams,
} from '~/types/steel-grade';

export interface SteelGradeProductItem {
  id: string;
  name: string;
  category: string;
}

export const steelGradesApi = {
  getList: async (params: SteelGradeListParams): Promise<PaginatedSteelGradesResponse> => {
    const response = await api.get('/steel-grade', {
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
    const res = await api.get(`/steel-grade/${steelGradeId}/products`);
    return (res.data?.value || res.data?.data || res.data || []) as SteelGradeProductItem[];
  },

  create: async (payload: AddSteelGradePayload) => {
    const response = await api.post('/steel-grade', payload);
    return response.data;
  },

  edit: async (payload: EditSteelGradePayload) => {
    const response = await api.patch('/steel-grade', payload);
    return response.data;
  },

  delete: async ({ id, reassignments }: DeleteSteelGradeParams) => {
    const response = await api.delete(`/steel-grade/${id}`, {
      data: { reassignments },
    });
    return response.data;
  },
};
