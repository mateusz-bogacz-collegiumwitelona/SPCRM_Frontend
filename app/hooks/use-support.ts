import { useMutation } from '@tanstack/react-query';
import { supportApi } from '~/api/support.api';
import type { ApiError, FormErrorState } from '~/types/api-error';
import { getErrorMessage } from '~/constants/error-mapper';
import type { SupportFormData } from '~/types/support';

interface UseSendSupportOptions {
  onSuccess?: () => void;
  onError?: (formError: FormErrorState) => void;
}

export function useSendSupportMessage(options?: UseSendSupportOptions) {
  return useMutation({
    mutationFn: (payload: SupportFormData) => supportApi.sendMessage(payload),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      const err = error as ApiError;
      const errorData = err.response?.data;
      const code = errorData?.errorCode;
      const fallback = errorData?.message || err.message || 'Wystąpił nieznany błąd.';

      const parsedError: FormErrorState = {
        title: getErrorMessage(code, fallback),
        details:
          errorData?.errors && errorData.errors.length > 0
            ? errorData.errors.map((item) => getErrorMessage(item, item))
            : undefined,
      };

      options?.onError?.(parsedError);
    },
  });
}
