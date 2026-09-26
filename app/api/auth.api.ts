import { api } from '~/api/api';
import type {
  ConfirmEmailChangePayload,
  ConfirmEmailPayload,
  LoginPayload,
  ResetPasswordPayload,
  User,
} from '~/interfaces/auth';

export const authApi = {
  login: async (payload: LoginPayload) => {
    const response = await api.post('auth/login', payload);
    return response.data;
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  confirmEmail: async (payload: ConfirmEmailPayload) => {
    const response = await api.post('/user/confirm-email', payload);
    return response.data;
  },

  confirmEmailChange: async (payload: ConfirmEmailChangePayload) => {
    const response = await api.post('/user/confirm-email-change', payload);
    return response.data;
  },

  getMe: async (): Promise<User | null> => {
    const response = await api.get('/auth/me');
    if (response.data?.success) {
      return response.data.data;
    }
    return null;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};
