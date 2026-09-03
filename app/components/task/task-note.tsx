import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import type { NoteResponse } from '~/interfaces/note-response';
import { NotesSection } from '~/components/note/notes-section';
import { useEditNote } from '~/hooks/use-edit-note';
import { type NoteEditData, NoteEditDialog } from '~/components/note/note-edit-dialog';
import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useAddNote } from '~/hooks/use-add-note';
import { NoteAddDialog } from '~/components/note/note-add-dialog';
import { UseDeleteNote } from '~/hooks/use-delete-note';
import { NoteDeleteDialog } from '~/components/note/note-delete-dialog';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

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

  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  const { mutateAsync: editNoteAsync } = useEditNote({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['task-notes', taskId] });
      setEditingNote(null);
    },
  });

  const { mutateAsync: addNoteAsync, isPending: isAdding } = useAddNote({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['task-notes', taskId] });
      setIsAddModalOpen(false);
    },
  });

  const { mutateAsync: deleteNoteAsync, isPending: isDeleting } = UseDeleteNote({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['task-notes', taskId] });
      setDeletingNoteId(null);
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

  const formError: FormErrorState | null =
    isError && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message || activeError?.message || 'Nie udało się pobrać listy notatek.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  return (
    <>
      {formError && (
        <div className="mb-4 relative flex items-start gap-2.5 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 pr-4">
            <p className="font-medium leading-tight">{formError.title}</p>
            {formError.details && formError.details.length > 0 && (
              <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                {formError.details.map((detailErr, idx) => (
                  <li key={idx}>{detailErr}</li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsErrorDismissed(true)}
            className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
            title="Zamknij"
          >
            <X className="w-4 h-4" />
          </button>
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
