import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unitsApi } from '~/api/unit.api';
import type { AddUnitRequestPayload, EditUnitRequestPayload, UnitListParams } from '~/types/unit';

export const unitKeys = {
  all: ['units-of-measure'] as const,
  list: (params: Record<string, unknown>) => [...unitKeys.all, 'list', params] as const,
  simple: () => ['units-of-measure-simple'] as const,
};

interface UseUnitsListProps {
  pageNumber: number;
  pageSize: number;
  debouncedSearch: string;
  sortBy: string;
  sortDescending: boolean;
}

export function useUnitsList({
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
}: UseUnitsListProps) {
  const queryParams: UnitListParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy,
    sortDescending,
  };

  return useQuery({
    queryKey: unitKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: () => unitsApi.getList(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useUnitMutations() {
  const queryClient = useQueryClient();

  const invalidateUnitLists = async () => {
    await queryClient.invalidateQueries({ queryKey: unitKeys.all });
    await queryClient.invalidateQueries({ queryKey: unitKeys.simple() });
  };

  const addMutation = useMutation({
    mutationFn: (payload: AddUnitRequestPayload) => unitsApi.create(payload),
    onSuccess: invalidateUnitLists,
  });

  const editMutation = useMutation({
    mutationFn: (payload: EditUnitRequestPayload) => unitsApi.edit(payload),
    onSuccess: invalidateUnitLists,
  });

  return {
    addMutation,
    editMutation,
  };
}

export function useUnitsSimpleList(enabled = true) {
  return useQuery({
    queryKey: unitKeys.simple(),
    queryFn: unitsApi.getSimpleList,
    enabled,
    staleTime: Infinity,
  });
}
