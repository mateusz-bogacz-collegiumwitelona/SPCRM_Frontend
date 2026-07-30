import { useMutation } from '@tanstack/react-query';
import { api } from '~/api/api';

interface UseDeleteNoteOptions {
  onSuccess: () => void;
}

export const UseDeleteNote = (options?: UseDeleteNoteOptions) => {
  return useMutation({
    mutationFn: async (noteId: string) => {
      const response = await api.delete('/note', { params: { id: noteId } });
      return response.data;
    },
    onSuccess: () => {
      options?.onSuccess?.();
    },
  });
};
