import { useMutation, useQuery } from '@tanstack/react-query';
import { mailingApi } from '~/api/mailing.api';
import type { ApiError, FormErrorState } from '~/types/api-error';
import { getErrorMessage } from '~/utils/error-mapper';
import type { SendMailingPayload } from '~/types/mailing';
import { currenciesApi } from '~/api/currency.api';

export const mailingKeys = {
  all: ['mailing'] as const,
  currencies: () => [...mailingKeys.all, 'currencies'] as const,
  contacts: (search: string) => [...mailingKeys.all, 'contacts', search] as const,
  products: (search: string) => [...mailingKeys.all, 'products', search] as const,
};

export function useMailingCurrencies() {
  return useQuery({
    queryKey: mailingKeys.currencies(),
    queryFn: currenciesApi.getSimpleList,
    staleTime: Infinity,
  });
}

export function useMailingContacts(searchTerm = '', pageSize = 50, enabled = true) {
  return useQuery({
    queryKey: [...mailingKeys.contacts(searchTerm), pageSize],
    queryFn: () => mailingApi.getContacts({ searchTerm, pageSize }),
    enabled,
  });
}

export function useMailingProducts(searchTerm: string, enabled: boolean) {
  return useQuery({
    queryKey: mailingKeys.products(searchTerm),
    queryFn: () => mailingApi.getProducts(searchTerm),
    enabled,
  });
}

interface UseSendMailingOptions {
  onSuccess?: () => void;
  onError?: (error: FormErrorState) => void;
}

export function useSendMailing(options?: UseSendMailingOptions) {
  return useMutation({
    mutationFn: (payload: SendMailingPayload) => mailingApi.sendMailing(payload),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (err: unknown) => {
      const error = err as ApiError;
      const errorData = error.response?.data;
      const code = errorData?.errorCode;
      const fallback = errorData?.message || error.message || 'Błąd podczas wysyłania mailingu.';

      let errorDetails: string[] | undefined;
      if (errorData?.errors && errorData.errors.length > 0) {
        errorDetails = errorData.errors.map((item) => getErrorMessage(item, item));
      }

      options?.onError?.({
        title: getErrorMessage(code, fallback),
        details: errorDetails,
      });
    },
  });
}
