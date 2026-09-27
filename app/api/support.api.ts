import { client } from '~/lib/client';
import type { SupportFormData } from '~/types/support';

export const supportApi = {
  sendMessage: async (payload: SupportFormData) => {
    const response = await client.post('/mailing/support', payload);
    return response.data;
  },
};
