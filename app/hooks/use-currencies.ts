import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { currenciesApi } from '~/api/currency.api';
import type {
  AddCurrencyRequestPayload,
  CurrencyListParams,
  EditCurrencyRequestPayload,
} from '~/types/currency';

export const currencyKeys = {
  all: ['currencies'] as const,
  list: (params: Record<string, unknown>) => [...currencyKeys.all, 'list', params] as const,
  simple: () => ['currencies-simple'] as const,
};

interface UseCurrenciesListProps {
  pageNumber: number;
  pageSize: number;
  debouncedSearch: string;
  sortBy: string;
  sortDescending: boolean;
}

export function useCurrenciesList({
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
}: UseCurrenciesListProps) {
  const queryParams: CurrencyListParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy,
    sortDescending,
  };

  return useQuery({
    queryKey: currencyKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: () => currenciesApi.getList(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useCurrencyMutations() {
  const queryClient = useQueryClient();

  const invalidateCurrencyData = async () => {
    await queryClient.invalidateQueries({ queryKey: currencyKeys.all });
    await queryClient.invalidateQueries({ queryKey: currencyKeys.simple() });
  };

  const addMutation = useMutation({
    mutationFn: (payload: AddCurrencyRequestPayload) => currenciesApi.create(payload),
    onSuccess: invalidateCurrencyData,
  });

  const editMutation = useMutation({
    mutationFn: (payload: EditCurrencyRequestPayload) => currenciesApi.edit(payload),
    onSuccess: invalidateCurrencyData,
  });

  return {
    addMutation,
    editMutation,
  };
}

export function useCurrenciesSimpleList(enabled = true) {
  return useQuery({
    queryKey: currencyKeys.simple(),
    queryFn: currenciesApi.getSimpleList,
    enabled,
    staleTime: Infinity,
  });
}
