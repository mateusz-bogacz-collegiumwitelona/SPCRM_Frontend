import { axios } from '~/lib/axios';
import type { AddNotePayload, NoteEditData } from '~/types/note';

export const notesApi = {
  create: async (payload: AddNotePayload) => {
    const response = await axios.post('/note', payload);
    return response.data;
  },

  edit: async (data: NoteEditData) => {
    const response = await axios.patch('/note/edit', {
      id: data.id,
      title: data.title,
      content: data.content,
    });
    return response.data;
  },

  delete: async (noteId: string) => {
    const response = await axios.delete('/note', { params: { id: noteId } });
    return response.data;
  },
};
