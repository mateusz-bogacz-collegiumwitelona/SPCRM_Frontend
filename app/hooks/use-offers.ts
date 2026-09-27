import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import { offersApi } from '~/api/offer.api';
import type { OfferListParams, OfferProductsParams, UpdateOfferProductItem } from '~/types/offer';

export const offerKeys = {
  all: ['offers'] as const,
  list: (params: Record<string, unknown>) => [...offerKeys.all, 'list', params] as const,
  statuses: () => [...offerKeys.all, 'statuses'] as const,
  companySimpleList: () => ['companies', 'simple-list'] as const,
  details: (id?: string) => ['offer-detail', id] as const,
  allowedActions: (id?: string) => ['offer-allowed-actions', id] as const,
  products: (id?: string, params?: Record<string, unknown>) =>
    ['offer-products', id, params] as const,
  clientDetail: (id?: string) => ['offer-client-detail', id] as const,
};

interface UseOffersListProps {
  pageNumber: number;
  pageSize: number;
  debouncedSearch: string;
  sortBy: string;
  sortDescending: boolean;
  statusFilter: string;
  companyNameFilter: string;
  isExpiredFilter: string;
  dateRange?: DateRange;
}

export function useOffersList({
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
  statusFilter,
  companyNameFilter,
  isExpiredFilter,
  dateRange,
}: UseOffersListProps) {
  const isExpired = isExpiredFilter !== '' ? isExpiredFilter === 'true' : undefined;

  const validUntilFrom = dateRange?.from
    ? new Date(
        Date.UTC(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()),
      ).toISOString()
    : undefined;

  const validUntilTo = dateRange?.to
    ? new Date(
        Date.UTC(
          dateRange.to.getFullYear(),
          dateRange.to.getMonth(),
          dateRange.to.getDate(),
          23,
          59,
          59,
          999,
        ),
      ).toISOString()
    : undefined;

  const queryParams: OfferListParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy,
    sortDescending,
    status: statusFilter,
    companyName: companyNameFilter,
    isExpired,
    validUntilFrom,
    validUntilTo,
  };

  return useQuery({
    queryKey: offerKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: () => offersApi.getList(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useOfferStatuses() {
  return useQuery({
    queryKey: offerKeys.statuses(),
    queryFn: offersApi.getStatuses,
    staleTime: Infinity,
  });
}

export function useOfferCompaniesSimpleList() {
  return useQuery({
    queryKey: offerKeys.companySimpleList(),
    queryFn: offersApi.getCompaniesSimpleList,
  });
}

export function useOfferDetails(offerId?: string) {
  return useQuery({
    queryKey: offerKeys.details(offerId),
    queryFn: () => offersApi.getDetails(offerId || ''),
    enabled: Boolean(offerId),
    retry: false,
  });
}

export function useOfferAllowedActions(offerId?: string) {
  return useQuery({
    queryKey: offerKeys.allowedActions(offerId),
    queryFn: () => offersApi.getAllowedActions(offerId || ''),
    enabled: Boolean(offerId),
  });
}

export function useOfferDetailMutations(offerId?: string) {
  const queryClient = useQueryClient();

  const invalidateOffer = async () => {
    await queryClient.invalidateQueries({ queryKey: offerKeys.details(offerId) });
    await queryClient.invalidateQueries({ queryKey: offerKeys.allowedActions(offerId) });
    await queryClient.invalidateQueries({ queryKey: ['offers-list'] });
  };

  const updateProductsMutation = useMutation({
    mutationFn: (items: UpdateOfferProductItem[]) => offersApi.updateProducts(offerId || '', items),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['offer-products'] });
      await invalidateOffer();
    },
  });

  const extendValidityMutation = useMutation({
    mutationFn: (newDate?: Date) =>
      offersApi.extendValidity(offerId || '', newDate ? newDate.toISOString() : undefined),
    onSuccess: invalidateOffer,
  });

  const changeStatusMutation = useMutation({
    mutationFn: (newStatus: 'Accepted' | 'Rejected') =>
      offersApi.changeStatus(offerId || '', newStatus),
    onSuccess: invalidateOffer,
  });

  const resendEmailMutation = useMutation({
    mutationFn: (language: string) => offersApi.resendEmail(offerId || '', language),
  });

  const deleteOfferMutation = useMutation({
    mutationFn: () => offersApi.delete(offerId || ''),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['offers-list'] });
    },
  });

  return {
    updateProductsMutation,
    extendValidityMutation,
    changeStatusMutation,
    resendEmailMutation,
    deleteOfferMutation,
  };
}

export function useOfferClientDetail(offerId?: string) {
  return useQuery({
    queryKey: offerKeys.clientDetail(offerId),
    queryFn: () => offersApi.getClientDetail(offerId || ''),
    enabled: Boolean(offerId),
  });
}

interface UseOfferProductsProps {
  offerId: string;
  pageNumber: number;
  pageSize: number;
  debouncedSearch?: string;
}

export function useOfferProducts({
  offerId,
  pageNumber,
  pageSize,
  debouncedSearch,
}: UseOfferProductsProps) {
  const queryParams: OfferProductsParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
  };

  return useQuery({
    queryKey: offerKeys.products(offerId, queryParams as unknown as Record<string, unknown>),
    queryFn: () => offersApi.getOfferProducts(offerId, queryParams),
    placeholderData: keepPreviousData,
    enabled: Boolean(offerId),
  });
}
