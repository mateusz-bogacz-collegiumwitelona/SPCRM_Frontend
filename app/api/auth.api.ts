import { client } from '~/lib/client';
import type {
  ConfirmEmailChangePayload,
  ConfirmEmailPayload,
  LoginPayload,
  ResetPasswordPayload,
  User,
} from '~/types/auth';

export const authApi = {
  login: async (payload: LoginPayload) => {
    const response = await client.post('/auth/login', payload);
    return response.data;
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const response = await client.post('/auth/reset-password', payload);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await client.post('/auth/forgot-password', { email });
    return response.data;
  },

  confirmEmail: async (payload: ConfirmEmailPayload) => {
    const response = await client.post('/user/confirm-email', payload);
    return response.data;
  },

  confirmEmailChange: async (payload: ConfirmEmailChangePayload) => {
    const response = await client.post('/user/confirm-email-change', payload);
    return response.data;
  },

  getMe: async (): Promise<User | null> => {
    const response = await client.get('/auth/me');
    if (response.data?.success) {
      return response.data.data;
    }
    return null;
  },

  logout: async (): Promise<void> => {
    await client.post('/auth/logout');
  },
};
