import { api } from '~/api/api';
import type { SupportFormData } from '~/types/support';

export const supportApi = {
  sendMessage: async (payload: SupportFormData) => {
    const response = await api.post('mailing/support', payload);
    return response.data;
  },
};
