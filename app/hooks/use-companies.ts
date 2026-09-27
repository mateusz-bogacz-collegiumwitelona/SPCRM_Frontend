import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { companyApi } from '~/api/company.api';
import type {
  AddCompanyRequest,
  CompanyAddressFormData,
  EditCompanyRequest,
} from '~/types/company';
import type { AddContactRequest, EditContactRequest } from '~/types/contact';
import { contactsApi } from '~/api/contact.api';

export const companyKeys = {
  all: ['companies'] as const,
  list: (params: Record<string, unknown>) => [...companyKeys.all, 'list', params] as const,
  simple: () => [...companyKeys.all, 'simple-list'] as const,
  details: (id?: string) => [...companyKeys.all, 'details', id] as const,
  editDetails: (id?: string) => [...companyKeys.all, 'edit-details', id] as const,
  addresses: (id?: string) => [...companyKeys.all, 'addresses', id] as const,
  addressTypes: () => ['company-address-types'] as const,
  companyContacts: (id?: string, page?: number, size?: number) =>
    ['company-contacts', id, page, size] as const,
  debtSummary: (id?: string) => ['company-debt-summary', id] as const,
  debts: (id?: string, page?: number, size?: number) =>
    ['company-debts', { clientId: id, page, pageSize: size }] as const,
  companySales: (id?: string, page?: number, size?: number) =>
    ['company-sales', id, page, size] as const,
};

const parseIsYourFilter = (filterValue: string): boolean | undefined => {
  if (filterValue === 'true') return true;
  if (filterValue === 'false') return false;
  return undefined;
};

interface UseCompaniesListProps {
  pageNumber: number;
  pageSize: number;
  debouncedSearch: string;
  sortBy: string;
  sortDescending: boolean;
  date?: DateRange;
  isYourFilter: string;
}

export function useCompaniesList({
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
  date,
  isYourFilter,
}: UseCompaniesListProps) {
  const createdAtFrom = date?.from ? format(date.from, 'yyyy-MM-dd') : undefined;
  const createdAtTo = date?.to ? format(date.to, 'yyyy-MM-dd') : undefined;
  const isYour = parseIsYourFilter(isYourFilter);

  return useQuery({
    queryKey: companyKeys.list({
      pageNumber,
      pageSize,
      debouncedSearch,
      sortBy,
      sortDescending,
      createdAtFrom,
      createdAtTo,
      isYour,
    }),
    queryFn: () =>
      companyApi.getList({
        pageNumber,
        pageSize,
        searchTerm: debouncedSearch,
        sortBy,
        sortDescending,
        createdAtFrom,
        createdAtTo,
        isYour,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCompany(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddCompanyRequest) => companyApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all });
      options?.onSuccess?.();
    },
  });
}

export function useCompanyDetails(companyId?: string) {
  return useQuery({
    queryKey: companyKeys.details(companyId),
    queryFn: () => companyApi.getDetails(companyId || ''),
    enabled: Boolean(companyId),
    retry: false,
  });
}

export function useCompanyEditDetails(companyId?: string | null, enabled = true) {
  return useQuery({
    queryKey: companyKeys.editDetails(companyId || undefined),
    queryFn: () => companyApi.getEditDetails(companyId || ''),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useCompanyAddresses(companyId?: string) {
  return useQuery({
    queryKey: companyKeys.addresses(companyId),
    queryFn: () => companyApi.getAddresses(companyId || ''),
    enabled: Boolean(companyId),
  });
}

export function useCompanyAddressTypes(enabled = true) {
  return useQuery({
    queryKey: companyKeys.addressTypes(),
    queryFn: companyApi.getAddressTypes,
    enabled,
    staleTime: Infinity,
  });
}

export function useCompanyDetailMutations(companyId?: string) {
  const queryClient = useQueryClient();

  const invalidateCompany = async () => {
    await queryClient.invalidateQueries({ queryKey: companyKeys.details(companyId) });
    await queryClient.invalidateQueries({ queryKey: companyKeys.editDetails(companyId) });
    await queryClient.invalidateQueries({ queryKey: companyKeys.all });
  };

  const invalidateAddresses = async () => {
    await queryClient.invalidateQueries({ queryKey: companyKeys.addresses(companyId) });
    await queryClient.invalidateQueries({ queryKey: companyKeys.details(companyId) });
  };

  const editCompanyMutation = useMutation({
    mutationFn: (payload: EditCompanyRequest) => companyApi.edit(payload),
    onSuccess: invalidateCompany,
  });

  const saveAddressMutation = useMutation({
    mutationFn: (formData: CompanyAddressFormData) =>
      companyApi.saveAddress(companyId || '', formData),
    onSuccess: invalidateAddresses,
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => companyApi.deleteAddress(addressId),
    onSuccess: invalidateAddresses,
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: () => companyApi.deleteCompany(companyId || ''),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });

  const changeOwnerMutation = useMutation({
    mutationFn: (newOwnerId: string) => companyApi.changeOwner(companyId || '', newOwnerId),
    onSuccess: invalidateCompany,
  });

  return {
    editCompanyMutation,
    saveAddressMutation,
    deleteAddressMutation,
    deleteCompanyMutation,
    changeOwnerMutation,
  };
}

export function useCompanyContacts(companyId?: string, page = 1, pageSize = 4) {
  return useQuery({
    queryKey: ['company-contacts', companyId, page, pageSize],
    queryFn: () =>
      companyApi.getContacts({
        companyId: companyId || '',
        pageNumber: page,
        pageSize,
      }),
    enabled: Boolean(companyId),
    placeholderData: keepPreviousData,
  });
}

export function useCompanyContactSectionMutations(companyId?: string) {
  const queryClient = useQueryClient();

  const invalidateCompanyContacts = async () => {
    await queryClient.invalidateQueries({ queryKey: ['company-contacts', companyId] });
  };

  const addContactMutation = useMutation({
    mutationFn: (newContact: AddContactRequest) => contactsApi.create(newContact),
    onSuccess: invalidateCompanyContacts,
  });

  const editContactMutation = useMutation({
    mutationFn: (updatedContact: EditContactRequest) => contactsApi.edit(updatedContact),
    onSuccess: invalidateCompanyContacts,
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (contactId: string) => contactsApi.setPrimary(contactId),
    onSuccess: invalidateCompanyContacts,
  });

  return {
    addContactMutation,
    editContactMutation,
    setPrimaryMutation,
  };
}

export function useCompanyDebtSummary(companyId?: string) {
  return useQuery({
    queryKey: companyKeys.debtSummary(companyId),
    queryFn: () => companyApi.getDebtSummary(companyId || ''),
    enabled: Boolean(companyId),
  });
}

export function useCompanyDebts(companyId?: string, page = 1, pageSize = 10) {
  return useQuery({
    queryKey: companyKeys.debts(companyId, page, pageSize),
    queryFn: () =>
      companyApi.getDebts({
        companyId: companyId || '',
        pageNumber: page,
        pageSize,
      }),
    enabled: Boolean(companyId),
    placeholderData: keepPreviousData,
  });
}

export function useCompanySales(companyId?: string, page = 1, pageSize = 4) {
  return useQuery({
    queryKey: companyKeys.companySales(companyId, page, pageSize),
    queryFn: () =>
      companyApi.getSales({
        companyId: companyId || '',
        pageNumber: page,
        pageSize,
      }),
    enabled: Boolean(companyId),
    placeholderData: keepPreviousData,
  });
}
