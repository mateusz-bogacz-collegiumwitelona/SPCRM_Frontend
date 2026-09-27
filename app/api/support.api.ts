import { axios } from '~/lib/axios';
import type { SupportFormData } from '~/types/support';

export const supportApi = {
  sendMessage: async (payload: SupportFormData) => {
    const response = await axios.post('/mailing/support', payload);
    return response.data;
  },
};
