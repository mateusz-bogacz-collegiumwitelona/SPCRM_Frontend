import { useMutation } from '@tanstack/react-query';
import type { NoteEditData } from '~/components/note-edit-dialog';
import { api } from '~/api/api';

interface UseEditNoteOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export const useEditNote = (options?: UseEditNoteOptions) => {
  return useMutation({
    mutationFn: async (data: NoteEditData) => {
      const res = await api.patch('/note/edit', {
        id: data.id,
        title: data.title,
        content: data.content,
      });

      return res.data;
    },
    onSuccess: () => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
    },
    onError: (err) => {
      if (options?.onError) {
        options.onError(err);
      }
    },
  });
};
