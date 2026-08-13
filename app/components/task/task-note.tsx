import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import type { NoteResponse } from '~/interfaces/note-response';
import { NotesSection } from '~/components/note/notes-section';
import { useEditNote } from '~/hooks/use-edit-note';
import { NoteEditDialog, type NoteEditData } from '~/components/note/note-edit-dialog';
import { useState } from 'react';
import { useAddNote } from '~/hooks/use-add-note';
import { NoteAddDialog } from '~/components/note/note-add-dialog';
import { UseDeleteNote } from '~/hooks/use-delete-note';
import { NoteDeleteDialog } from '~/components/note/note-delete-dialog';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/apiError';

export const TaskNote = ({ taskId }: { taskId: string }) => {
  const queryClient = useQueryClient();

  const [editingNote, setEditingNote] = useState<NoteEditData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const {
    data: notes,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<NoteResponse[]>({
    queryKey: ['task-notes', taskId],
    queryFn: async () => {
      const response = await api.get(`/tasks/${taskId}/notes`);
      return response.data.data;
    },
  });

  const { mutateAsync: editNoteAsync } = useEditNote({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-notes', taskId] });
      setEditingNote(null);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback = (error as Error)?.message || 'Nie udało się edytować notatki.';
      alert(getErrorMessage(code, fallback));
    },
  });

  const { mutateAsync: addNoteAsync, isPending: isAdding } = useAddNote({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-notes', taskId] });
      setIsAddModalOpen(false);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback = (error as Error)?.message || 'Nie udało się dodać notatki.';
      alert(getErrorMessage(code, fallback));
    },
  });

  const { mutateAsync: deleteNoteAsync, isPending: isDeleting } = UseDeleteNote({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-notes', taskId] });
      setDeletingNoteId(null);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback = (error as Error)?.message || 'Nie udało się usunąć notatki.';
      alert(getErrorMessage(code, fallback));
    },
  });

  const handleDeleteConfirm = async () => {
    if (deletingNoteId) await deleteNoteAsync(deletingNoteId);
  };

  const handleEditClick = (note: NoteResponse) => {
    setEditingNote({
      id: note.noteId,
      title: note.title,
      content: note.content,
    });
  };

  const handleSaveNewNote = async (title: string, content: string) => {
    await addNoteAsync({
      targetId: taskId,
      title,
      content,
      noteType: 'Task',
    });
  };

  const errorMessage = isError
    ? getErrorMessage(
        (queryError as ApiError)?.response?.data?.errorCode,
        'Nie udało się pobrać listy notatek.',
      )
    : null;
  return (
    <>
      {errorMessage && (
        <div className="mb-4 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <NotesSection
        notes={notes}
        isLoading={isLoading}
        emptyMessage="Brak notatek dla tego zadania"
        onEditClick={handleEditClick}
        onAddClick={() => setIsAddModalOpen(true)}
        onDeleteClick={(note) => setDeletingNoteId(note.noteId)}
      />

      <NoteEditDialog
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        note={editingNote}
        onSave={editNoteAsync}
      />

      <NoteAddDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewNote}
        isLoading={isAdding}
      />

      <NoteDeleteDialog
        isOpen={!!deletingNoteId}
        onClose={() => setDeletingNoteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </>
  );
};
