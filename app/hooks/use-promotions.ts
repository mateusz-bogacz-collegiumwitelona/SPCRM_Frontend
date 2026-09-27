import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { promotionsApi } from '~/api/promotion.api';
import type {
  AddPromotionRequest,
  EditPromotionRequest,
  PromotionListParams,
} from '~/types/promotion';

export const promotionKeys = {
  all: ['promotions'] as const,
  list: (params: Record<string, unknown>) => [...promotionKeys.all, 'list', params] as const,
  details: (id?: string) => ['promotion-details', id] as const,
};

const parseIsActiveFilter = (filterValue: string): boolean | undefined => {
  if (filterValue === 'true') return true;
  if (filterValue === 'false') return false;
  return undefined;
};

interface UsePromotionsListProps {
  pageNumber: number;
  pageSize: number;
  debouncedSearch: string;
  sortBy: string;
  sortDescending: boolean;
  isActiveFilter: string;
  debouncedFilters: {
    date?: DateRange;
    discountFrom: string;
    discountTo: string;
    priceFrom: string;
    priceTo: string;
  };
}

export function usePromotionsList({
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
  isActiveFilter,
  debouncedFilters,
}: UsePromotionsListProps) {
  const fromDate = debouncedFilters.date?.from
    ? format(debouncedFilters.date.from, 'yyyy-MM-dd')
    : undefined;
  const toDate = debouncedFilters.date?.to
    ? format(debouncedFilters.date.to, 'yyyy-MM-dd')
    : undefined;

  const queryParams: PromotionListParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy,
    sortDescending,
    isActive: parseIsActiveFilter(isActiveFilter),
    fromDate,
    toDate,
    discountPercentageFrom: debouncedFilters.discountFrom
      ? Number(debouncedFilters.discountFrom)
      : undefined,
    discountPercentageTo: debouncedFilters.discountTo
      ? Number(debouncedFilters.discountTo)
      : undefined,
    promotionPriceFrom: debouncedFilters.priceFrom
      ? Number(debouncedFilters.priceFrom) * 10000
      : undefined,
    promotionPriceTo: debouncedFilters.priceTo
      ? Number(debouncedFilters.priceTo) * 10000
      : undefined,
  };

  return useQuery({
    queryKey: promotionKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: () => promotionsApi.getList(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function usePromotionDetails(promotionId?: string) {
  return useQuery({
    queryKey: promotionKeys.details(promotionId),
    queryFn: () => promotionsApi.getDetails(promotionId || ''),
    enabled: Boolean(promotionId),
    retry: false,
  });
}

interface UseCreatePromotionOptions {
  onSuccess?: (newPromotionId: string) => void;
}

export function useCreatePromotion(options?: UseCreatePromotionOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddPromotionRequest) => promotionsApi.create(payload),
    onSuccess: async (newPromotionId) => {
      await queryClient.invalidateQueries({ queryKey: promotionKeys.all });
      options?.onSuccess?.(newPromotionId);
    },
  });
}

export function usePromotionHeaderMutations(promotionId: string) {
  const queryClient = useQueryClient();

  const invalidatePromotion = async () => {
    await queryClient.invalidateQueries({ queryKey: promotionKeys.details(promotionId) });
    await queryClient.invalidateQueries({ queryKey: promotionKeys.all });
    await queryClient.invalidateQueries({ queryKey: ['promotions-list'] });
  };

  const deactivateMutation = useMutation({
    mutationFn: () => promotionsApi.deactivate(promotionId),
    onSuccess: invalidatePromotion,
  });

  const activateMutation = useMutation({
    mutationFn: (endDate: Date) => promotionsApi.activate(promotionId, endDate.toISOString()),
    onSuccess: invalidatePromotion,
  });

  const editMutation = useMutation({
    mutationFn: (payload: EditPromotionRequest) => promotionsApi.edit(payload),
    onSuccess: invalidatePromotion,
  });

  const deleteMutation = useMutation({
    mutationFn: () => promotionsApi.delete(promotionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: promotionKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['promotions-list'] });
    },
  });

  return {
    deactivateMutation,
    activateMutation,
    editMutation,
    deleteMutation,
  };
}
