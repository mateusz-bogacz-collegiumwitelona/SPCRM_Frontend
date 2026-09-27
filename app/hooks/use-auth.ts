import { useMutation } from '@tanstack/react-query';
import { authApi } from '~/api/auth.api';
import type { ApiError, FormErrorState } from '~/types/api-error';
import { getErrorMessage } from '~/constants/error-mapper';
import type {
  ConfirmEmailChangePayload,
  ConfirmEmailPayload,
  LoginPayload,
  ResetPasswordPayload,
} from '~/types/auth';

interface UseLoginOptions {
  onSuccess?: () => Promise<void> | void;
  onError?: (error: FormErrorState) => void;
}

export function useLoginMutation(options?: UseLoginOptions) {
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: async () => {
      await options?.onSuccess?.();
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      const status = apiError.response?.status;
      const errorData = apiError.response?.data;

      if (status === 401) {
        options?.onError?.({
          title: 'Niepoprawny login lub hasło.',
          details: [
            'Upewnij się, że wpisane dane są prawidłowe oraz czy konto ma potwierdzony adres e-mail.',
          ],
        });
        return;
      }

      if (errorData?.errorCode) {
        options?.onError?.({
          title: getErrorMessage(errorData.errorCode, errorData.message),
          details: errorData.errors && errorData.errors.length > 0 ? errorData.errors : undefined,
        });
        return;
      }

      options?.onError?.({
        title: apiError.message || 'Wystąpił błąd podczas logowania.',
      });
    },
  });
}

interface UseResetPasswordOptions {
  onSuccess?: () => void;
  onError?: (error: FormErrorState) => void;
}

export function useResetPasswordMutation(options?: UseResetPasswordOptions) {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      const errorData = apiError.response?.data;

      options?.onError?.({
        title: getErrorMessage(
          errorData?.errorCode,
          errorData?.message || apiError.message || 'Wystąpił błąd podczas resetowania hasła.',
        ),
        details: errorData?.errors && errorData.errors.length > 0 ? errorData.errors : undefined,
      });
    },
  });
}

interface UseForgotPasswordOptions {
  onSuccess?: () => void;
  onError?: (error: FormErrorState) => void;
}

export function useForgotPasswordMutation(options?: UseForgotPasswordOptions) {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      const errorData = apiError.response?.data;

      options?.onError?.({
        title: getErrorMessage(
          errorData?.errorCode,
          errorData?.message ||
            apiError.message ||
            'Wystąpił błąd podczas wysyłania linku resetującego.',
        ),
        details: errorData?.errors && errorData.errors.length > 0 ? errorData.errors : undefined,
      });
    },
  });
}

interface UseConfirmEmailOptions {
  onSuccess?: () => void;
  onError?: (error: FormErrorState) => void;
}

export function useConfirmEmailMutation(options?: UseConfirmEmailOptions) {
  return useMutation({
    mutationFn: (payload: ConfirmEmailPayload) => authApi.confirmEmail(payload),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      const errorData = apiError.response?.data;

      options?.onError?.({
        title: getErrorMessage(
          errorData?.errorCode,
          errorData?.message || apiError.message || 'Wystąpił błąd podczas aktywacji konta.',
        ),
        details: errorData?.errors && errorData.errors.length > 0 ? errorData.errors : undefined,
      });
    },
  });
}

interface UseConfirmEmailChangeOptions {
  onSuccess?: () => void;
  onError?: (error: FormErrorState) => void;
}

export function useConfirmEmailChangeMutation(options?: UseConfirmEmailChangeOptions) {
  return useMutation({
    mutationFn: (payload: ConfirmEmailChangePayload) => authApi.confirmEmailChange(payload),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      const errorData = apiError.response?.data;

      options?.onError?.({
        title: getErrorMessage(
          errorData?.errorCode,
          errorData?.message ||
            apiError.message ||
            'Wystąpił błąd podczas potwierdzania adresu e-mail.',
        ),
        details: errorData?.errors && errorData.errors.length > 0 ? errorData.errors : undefined,
      });
    },
  });
}
