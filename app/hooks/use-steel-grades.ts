import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { steelGradesApi } from '~/api/steel-grade.api';
import type {
  AddSteelGradePayload,
  DeleteSteelGradeParams,
  EditSteelGradePayload,
  SteelGradeListParams,
} from '~/interfaces/steel-grade';

export const steelGradeKeys = {
  all: ['steel-grades'] as const,
  list: (params: Record<string, unknown>) => [...steelGradeKeys.all, 'list', params] as const,
  productSteelGrades: () => ['product-steel-grades'] as const,
  products: (id?: string) => ['steel-grade-products', id] as const,
};

interface UseSteelGradesListProps {
  pageNumber: number;
  pageSize: number;
  debouncedSearch: string;
  sortBy: string;
  sortDescending: boolean;
}

export function useSteelGradesList({
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
}: UseSteelGradesListProps) {
  const queryParams: SteelGradeListParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy,
    sortDescending,
  };

  return useQuery({
    queryKey: steelGradeKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: () => steelGradesApi.getList(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useSteelGradeMutations() {
  const queryClient = useQueryClient();

  const invalidateLists = async () => {
    await queryClient.invalidateQueries({ queryKey: ['steel-grades-list'] });
    await queryClient.invalidateQueries({ queryKey: steelGradeKeys.all });
    await queryClient.invalidateQueries({ queryKey: steelGradeKeys.productSteelGrades() });
  };

  const addMutation = useMutation({
    mutationFn: (payload: AddSteelGradePayload) => steelGradesApi.create(payload),
    onSuccess: invalidateLists,
  });

  const editMutation = useMutation({
    mutationFn: (payload: EditSteelGradePayload) => steelGradesApi.edit(payload),
    onSuccess: invalidateLists,
  });

  const deleteMutation = useMutation({
    mutationFn: (params: DeleteSteelGradeParams) => steelGradesApi.delete(params),
    onSuccess: async () => {
      await invalidateLists();
      await queryClient.invalidateQueries({ queryKey: ['products-list'] });
    },
  });

  return {
    addMutation,
    editMutation,
    deleteMutation,
  };
}

export function useSteelGradeProducts(steelGradeId?: string, enabled = true) {
  return useQuery({
    queryKey: steelGradeKeys.products(steelGradeId),
    queryFn: () => steelGradesApi.getProducts(steelGradeId || ''),
    enabled: Boolean(steelGradeId) && enabled,
  });
}
