import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { dealsApi } from '~/api/deal.api';
import { usersApi } from '~/api/user.api';
import type {
  AddDealPayload,
  ChangeDealStatusPayload,
  ChangeStatusResponse,
  DealProductsParams,
  SalesListParams,
} from '~/interfaces/deal';

export const dealKeys = {
  all: ['sales'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...dealKeys.lists(), params] as const,
  recent: (pageSize: number) => [...dealKeys.all, 'recent', pageSize] as const,
  statuses: () => [...dealKeys.all, 'statuses'] as const,
  teamUsers: () => [...dealKeys.all, 'team-users'] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id?: string) => [...dealKeys.details(), id] as const,
  assignableContacts: (dealId?: string) =>
    [...dealKeys.detail(dealId), 'assignable-contacts'] as const,
  products: (dealId?: string, params?: Record<string, unknown>) =>
    [...dealKeys.detail(dealId), 'products', params] as const,
};

interface UseSalesListProps {
  pageNumber: number;
  pageSize: number;
  debouncedSearch: string;
  sortBy: string;
  sortDescending: boolean;
  date?: DateRange;
  statusFilter: string;
  ownerFilter: string;
  isManager: boolean;
}

export function useSalesList({
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
  date,
  statusFilter,
  ownerFilter,
  isManager,
}: UseSalesListProps) {
  const dateFrom = date?.from ? format(date.from, 'yyyy-MM-dd') : undefined;
  const dateTo = date?.to ? format(date.to, 'yyyy-MM-dd') : undefined;
  const ownerId = isManager && ownerFilter ? ownerFilter : undefined;

  const queryParams: SalesListParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy,
    sortDescending,
    dateFrom,
    dateTo,
    statusType: statusFilter,
    ownerId,
  };

  return useQuery({
    queryKey: dealKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: () => dealsApi.getList(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useSalesStatuses() {
  return useQuery({
    queryKey: dealKeys.statuses(),
    queryFn: dealsApi.getStatuses,
    staleTime: Infinity,
  });
}

export function useSalesTeamUsers(enabled = true) {
  return useQuery({
    queryKey: dealKeys.teamUsers(),
    queryFn: usersApi.getTeamUsers,
    enabled,
  });
}

export function useDealDetails(dealId?: string) {
  return useQuery({
    queryKey: dealKeys.detail(dealId),
    queryFn: () => dealsApi.getDetails(dealId || ''),
    enabled: Boolean(dealId),
    retry: false,
  });
}

export function useDealAssignableContacts(dealId?: string, enabled = true) {
  return useQuery({
    queryKey: dealKeys.assignableContacts(dealId),
    queryFn: () => dealsApi.getAssignableContacts(dealId || ''),
    enabled: Boolean(dealId) && enabled,
  });
}

export function useInvalidateSales() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: dealKeys.all });
}

export function useCreateDealMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddDealPayload) => dealsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: dealKeys.all });
      options?.onSuccess?.();
    },
  });
}

export function useAddProductToDealMutation(dealId: string, options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { productId: string; quantity: number; unitPrice: number }) =>
      dealsApi.addProductToDeal(dealId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
      await queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      options?.onSuccess?.();
    },
  });
}

export function useChangeDealStatusMutation(
  dealId: string,
  options?: { onSuccess?: (data: ChangeStatusResponse) => void },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeDealStatusPayload) => dealsApi.changeStatus(dealId, payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
      await queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      options?.onSuccess?.(data);
    },
  });
}

export function useEditDealProductMutation(dealId: string, options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { dealProductId: string; quantity: number; unitPrice: number }) =>
      dealsApi.editDealProduct(dealId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
      await queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      options?.onSuccess?.();
    },
  });
}

export function useDealInfoMutations(dealId: string) {
  const queryClient = useQueryClient();

  const invalidateDeal = async () => {
    await queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
    await queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
  };

  const deleteDealMutation = useMutation({
    mutationFn: () => dealsApi.delete(dealId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.removeQueries({ queryKey: dealKeys.detail(dealId) });
    },
  });

  const extendDealMutation = useMutation({
    mutationFn: (newCloseDate: Date) =>
      dealsApi.extendCloseDate(dealId, newCloseDate.toISOString()),
    onSuccess: invalidateDeal,
  });

  const changeContactMutation = useMutation({
    mutationFn: (newContactId: string) => dealsApi.changeContact(dealId, newContactId),
    onSuccess: invalidateDeal,
  });

  return {
    deleteDealMutation,
    extendDealMutation,
    changeContactMutation,
  };
}

export function useDealProducts(dealId: string, params: DealProductsParams) {
  return useQuery({
    queryKey: dealKeys.products(dealId, params as unknown as Record<string, unknown>),
    queryFn: () => dealsApi.getDealProducts(dealId, params),
    placeholderData: keepPreviousData,
    enabled: Boolean(dealId),
  });
}

export function useDeleteDealProductMutation(dealId: string, options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dealProductId: string) => dealsApi.deleteDealProduct(dealId, dealProductId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
      await queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      options?.onSuccess?.();
    },
  });
}

export function useRecentSales(pageSize = 5) {
  return useQuery({
    queryKey: dealKeys.recent(pageSize),
    queryFn: async () => {
      const res = await dealsApi.getList({
        pageNumber: 1,
        pageSize,
        sortBy: 'date',
        sortDescending: true,
      });
      return res?.items || [];
    },
  });
}
