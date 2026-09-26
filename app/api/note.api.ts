import { api } from '~/api/api';
import type { AddNotePayload, Note, NoteEditData } from '~/interfaces/note';

export const notesApi = {
  getDealNotes: async (dealId: string): Promise<Note[]> => {
    const response = await api.get(`/sales/${dealId}/notes`);
    return response.data?.data || response.data?.value || response.data || [];
  },

  addDealNote: async (dealId: string, payload: { title: string; content: string }) => {
    const response = await api.post(`/sales/${dealId}/notes`, payload);
    return response.data;
  },

  getTaskNotes: async (taskId: string): Promise<Note[]> => {
    const response = await api.get(`/tasks/${taskId}/notes`);
    return response.data?.data || response.data?.value || response.data || [];
  },

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
