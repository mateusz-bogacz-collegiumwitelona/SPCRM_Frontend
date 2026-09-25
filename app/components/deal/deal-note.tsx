import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import type { Note, NoteEditData } from '~/interfaces/note';
import { NotesSection } from '~/components/note/notes-section';
import { AddNoteDialog } from '~/components/note/dialogs/add-note-dialog';
import { DeleteNoteDialog } from '~/components/note/dialogs/delete-note-dialog';
import { EditNoteDialog } from '~/components/note/dialogs/edit-note-dialog';
import { UseDeleteNote } from '~/hooks/use-delete-note';
import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export const DealNote = ({ dealId }: { dealId: string }) => {
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteEditData | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const {
    data: notes,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<Note[]>({
    queryKey: ['deal-notes', dealId],
    queryFn: async () => {
      const response = await api.get(`/sales/${dealId}/notes`);
      return response.data?.data || response.data?.value || response.data || [];
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      return await api.post(`/sales/${dealId}/notes`, { title, content });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['deal-notes', dealId] });
      setIsAddModalOpen(false);
    },
  });

  const editNoteMutation = useMutation({
    mutationFn: async (data: NoteEditData) => {
      return await api.patch('/note/edit', {
        id: data.id,
        title: data.title,
        content: data.content,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['deal-notes', dealId] });
      setEditingNote(null);
    },
  });

  const { mutateAsync: deleteNoteAsync, isPending: isDeleting } = UseDeleteNote({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['deal-notes', dealId] });
      setDeletingNoteId(null);
    },
  });

  const handleDeleteConfirm = async () => {
    if (deletingNoteId) await deleteNoteAsync(deletingNoteId);
  };

  const handleSaveNewNote = async (title: string, content: string) => {
    await addNoteMutation.mutateAsync({ title, content });
  };

  const handleSaveEditedNote = async (data: NoteEditData) => {
    await editNoteMutation.mutateAsync(data);
  };

  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  const listError: FormErrorState | null =
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
      {listError && (
        <div className="mb-4 relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 pr-4">
            <p className="font-medium leading-tight">{listError.title}</p>
            {listError.details && listError.details.length > 0 && (
              <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                {listError.details.map((detailErr, idx) => (
                  <li key={`${detailErr}-${idx}`}>{detailErr}</li>
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
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <NotesSection
        notes={notes}
        isLoading={isLoading}
        emptyMessage="Brak notatek dla tej transakcji"
        onAddClick={() => setIsAddModalOpen(true)}
        onEditClick={(note) =>
          setEditingNote({
            id: note.noteId,
            title: note.title,
            content: note.content,
          })
        }
        onDeleteClick={(note) => setDeletingNoteId(note.noteId)}
      />

      <AddNoteDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewNote}
        isLoading={addNoteMutation.isPending}
      />

      <EditNoteDialog
        isOpen={Boolean(editingNote)}
        onClose={() => setEditingNote(null)}
        note={editingNote}
        onSave={handleSaveEditedNote}
      />

      <DeleteNoteDialog
        isOpen={Boolean(deletingNoteId)}
        onClose={() => setDeletingNoteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </>
  );
};
