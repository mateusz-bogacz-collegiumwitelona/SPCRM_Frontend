import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '~/api/note.api';
import type { AddNotePayload, NoteEditData } from '~/interfaces/note';
import { dealsApi } from '~/api/deal.api';
import { tasksApi } from '~/api/task.api';

export const noteKeys = {
  all: ['notes'] as const,
  dealNotes: (dealId?: string) => ['deal-notes', dealId] as const,
  taskNotes: (taskId?: string) => ['task-notes', taskId] as const,
  contactNotes: (contactId?: string) => ['contact-notes', contactId] as const,
};

export function useDealNotes(dealId?: string) {
  return useQuery({
    queryKey: noteKeys.dealNotes(dealId),
    queryFn: () => dealsApi.getDealNotes(dealId || ''),
    enabled: Boolean(dealId),
  });
}

export function useDealNotesMutations(dealId: string) {
  const queryClient = useQueryClient();

  const invalidateDealNotes = async () => {
    await queryClient.invalidateQueries({ queryKey: noteKeys.dealNotes(dealId) });
  };

  const addNoteMutation = useMutation({
    mutationFn: (payload: { title: string; content: string }) =>
      dealsApi.addDealNote(dealId, payload),
    onSuccess: invalidateDealNotes,
  });

  const editNoteMutation = useMutation({
    mutationFn: (data: NoteEditData) => notesApi.edit(data),
    onSuccess: invalidateDealNotes,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesApi.delete(noteId),
    onSuccess: invalidateDealNotes,
  });

  return {
    addNoteMutation,
    editNoteMutation,
    deleteNoteMutation,
  };
}

export function useTaskNotes(taskId?: string) {
  return useQuery({
    queryKey: noteKeys.taskNotes(taskId),
    queryFn: () => tasksApi.getTaskNotes(taskId || ''),
    enabled: Boolean(taskId),
  });
}

export function useTaskNotesMutations(taskId: string) {
  const queryClient = useQueryClient();

  const invalidateTaskNotes = async () => {
    await queryClient.invalidateQueries({ queryKey: noteKeys.taskNotes(taskId) });
  };

  const addNoteMutation = useMutation({
    mutationFn: (payload: { title: string; content: string }) =>
      notesApi.create({
        targetId: taskId,
        title: payload.title,
        content: payload.content,
        noteType: 'Task',
      }),
    onSuccess: invalidateTaskNotes,
  });

  const editNoteMutation = useMutation({
    mutationFn: (data: NoteEditData) => notesApi.edit(data),
    onSuccess: invalidateTaskNotes,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesApi.delete(noteId),
    onSuccess: invalidateTaskNotes,
  });

  return {
    addNoteMutation,
    editNoteMutation,
    deleteNoteMutation,
  };
}

export const useAddNote = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  return useMutation({
    mutationFn: (payload: AddNotePayload) => notesApi.create(payload),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};

export const useEditNote = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  return useMutation({
    mutationFn: (data: NoteEditData) => notesApi.edit(data),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};

export const useDeleteNote = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  return useMutation({
    mutationFn: (noteId: string) => notesApi.delete(noteId),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};
