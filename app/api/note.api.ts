import { api } from '~/api/api';
import type { AddNotePayload, NoteEditData } from '~/types/note';

export const notesApi = {
  create: async (payload: AddNotePayload) => {
    const response = await api.post('/note', payload);
    return response.data;
  },

  edit: async (data: NoteEditData) => {
    const response = await api.patch('/note/edit', {
      id: data.id,
      title: data.title,
      content: data.content,
    });
    return response.data;
  },

  delete: async (noteId: string) => {
    const response = await api.delete('/note', { params: { id: noteId } });
    return response.data;
  },
};
