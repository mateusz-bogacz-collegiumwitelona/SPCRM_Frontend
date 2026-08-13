import { useMutation } from '@tanstack/react-query';
import { api } from '~/api/api';

export interface AddNotePayload {
  targetId: string;
  title: string;
  content: string;
  noteType: 'Contact' | 'Deal' | 'Task';
}

export const useAddNote = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  return useMutation({
    mutationFn: async (payload: AddNotePayload) => {
      const response = await api.post('/note', payload);
      return response.data;
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};
