import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import type { NoteResponse } from '~/interfaces/note-response';
import { NotesSection } from '~/components/note/notes-section';
import { useAddNote } from '~/hooks/use-add-note';
import { NoteAddDialog } from '~/components/note/note-add-dialog';
import { useState } from 'react';
import { UseDeleteNote } from '~/hooks/use-delete-note';
import { NoteDeleteDialog } from '~/components/note/note-delete-dialog';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/apiError';

export const SaleNote = ({ dealId }: { dealId: string }) => {
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const {
    data: notes,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<NoteResponse[]>({
    queryKey: ['deal-notes', dealId],
    queryFn: async () => {
      const response = await api.get(`/sales/${dealId}/notes`);
      return response.data.data;
    },
  });

  const { mutateAsync: addNoteAsync, isPending: isAdding } = useAddNote({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-notes', dealId] });
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
      queryClient.invalidateQueries({ queryKey: ['deal-notes', dealId] });
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

  const handleSaveNewNote = async (title: string, content: string) => {
    await addNoteAsync({
      targetId: dealId,
      title,
      content,
      noteType: 'Deal',
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
        onDeleteClick={(note) => setDeletingNoteId(note.noteId)}
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
