import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '~/api/contact.api';
import type { ContactListParams, EditContactRequest } from '~/types/contact';

export const contactKeys = {
  all: ['contacts'] as const,
  list: (params: Record<string, unknown>) => [...contactKeys.all, 'list', params] as const,
  companies: () => [...contactKeys.all, 'companies'] as const,
  availableOwners: () => [...contactKeys.all, 'available-owners'] as const,
  details: (id?: string) => ['contact-details', id] as const,
  editDetails: (id?: string) => ['contact-edit-detail', id] as const,
  ways: (id?: string) => ['contact-ways', id] as const,
  types: () => ['contact-types'] as const,
  toDeals: (page: number, search?: string) => ['contacts-to-deal', page, search] as const,
};

const parseIsPrimaryFilter = (filterValue: string): boolean | undefined => {
  if (filterValue === 'true') return true;
  if (filterValue === 'false') return false;
  return undefined;
};

interface UseContactsListProps {
  pageNumber: number;
  pageSize: number;
  debouncedSearch: string;
  sortBy: string;
  sortDescending: boolean;
  companyFilter: string;
  isPrimaryFilter: string;
  ownerFilter: string;
  currentUserId?: string;
}

export function useContactsList({
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
  companyFilter,
  isPrimaryFilter,
  ownerFilter,
  currentUserId,
}: UseContactsListProps) {
  const isPrimary = parseIsPrimaryFilter(isPrimaryFilter);
  const ownerId = ownerFilter === 'me' ? currentUserId : ownerFilter || undefined;

  const queryParams: ContactListParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy,
    sortDescending,
    companyName: companyFilter,
    isPrimary,
    ownerId,
  };

  return useQuery({
    queryKey: contactKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: () => contactsApi.getList(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useContactCompanies() {
  return useQuery({
    queryKey: contactKeys.companies(),
    queryFn: contactsApi.getCompanies,
  });
}

export function useAvailableOwners(enabled = true) {
  return useQuery({
    queryKey: contactKeys.availableOwners(),
    queryFn: contactsApi.getAvailableOwners,
    enabled,
  });
}

export function useContactDetails(contactId?: string) {
  return useQuery({
    queryKey: contactKeys.details(contactId),
    queryFn: () => contactsApi.getDetails(contactId || ''),
    enabled: Boolean(contactId),
    retry: false,
  });
}

export function useContactEditDetails(contactId?: string | null, enabled = true) {
  return useQuery({
    queryKey: contactKeys.editDetails(contactId || undefined),
    queryFn: () => contactsApi.getEditDetails(contactId || ''),
    enabled: Boolean(contactId) && enabled,
  });
}

export function useContactWays(contactId?: string) {
  return useQuery({
    queryKey: contactKeys.ways(contactId),
    queryFn: () => contactsApi.getWays(contactId || ''),
    enabled: Boolean(contactId),
  });
}

export function useContactTypes(enabled = true) {
  return useQuery({
    queryKey: contactKeys.types(),
    queryFn: contactsApi.getTypes,
    enabled,
    staleTime: Infinity,
  });
}

export function useContactMutations(contactId?: string) {
  const queryClient = useQueryClient();

  const invalidateContacts = async () => {
    await queryClient.invalidateQueries({ queryKey: contactKeys.all });
    if (contactId) {
      await queryClient.invalidateQueries({ queryKey: contactKeys.details(contactId) });
      await queryClient.invalidateQueries({ queryKey: contactKeys.editDetails(contactId) });
      await queryClient.invalidateQueries({ queryKey: contactKeys.ways(contactId) });
    }
  };

  const editContactMutation = useMutation({
    mutationFn: (updatedContact: EditContactRequest) => contactsApi.edit(updatedContact),
    onSuccess: invalidateContacts,
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => contactsApi.setPrimary(id),
    onSuccess: invalidateContacts,
  });

  const changeOwnerMutation = useMutation({
    mutationFn: (payload: { contactId: string; newOwnerId: string }) =>
      contactsApi.changeOwner(payload),
    onSuccess: invalidateContacts,
  });

  const deleteContactMutation = useMutation({
    mutationFn: () => contactsApi.delete(contactId || ''),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contactKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['company-contacts'] });
    },
  });

  return {
    editContactMutation,
    setPrimaryMutation,
    changeOwnerMutation,
    deleteContactMutation,
  };
}

export function useContactsToDeal(pageNumber: number, searchTerm?: string, enabled = true) {
  return useQuery({
    queryKey: ['contacts-to-deal', pageNumber, searchTerm],
    queryFn: () =>
      contactsApi.getToDeals({
        pageNumber,
        pageSize: 20,
        searchTerm,
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}
