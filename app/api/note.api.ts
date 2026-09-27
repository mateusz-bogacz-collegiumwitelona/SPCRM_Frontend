import { client } from '~/lib/client';
import type { AddNotePayload, NoteEditData } from '~/types/note';

export const notesApi = {
  create: async (payload: AddNotePayload) => {
    const response = await client.post('/note', payload);
    return response.data;
  },

  edit: async (data: NoteEditData) => {
    const response = await client.patch('/note/edit', {
      id: data.id,
      title: data.title,
      content: data.content,
    });
    return response.data;
  },

  delete: async (noteId: string) => {
    const response = await client.delete('/note', { params: { id: noteId } });
    return response.data;
  },
};
