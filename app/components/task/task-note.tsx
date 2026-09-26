import type { Note, NoteEditData } from '~/interfaces/note';
import { NotesSection } from '~/components/note/notes-section';
import { EditNoteDialog } from '~/components/note/dialogs/edit-note-dialog';
import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { AddNoteDialog } from '~/components/note/dialogs/add-note-dialog';
import { DeleteNoteDialog } from '~/components/note/dialogs/delete-note-dialog';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { useTaskNotes, useTaskNotesMutations } from '~/hooks/use-notes';

export const TaskNote = ({ taskId }: { taskId: string }) => {
  const [editingNote, setEditingNote] = useState<NoteEditData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  const { data: notes, isLoading, isError, error: queryError } = useTaskNotes(taskId);

  const { addNoteMutation, editNoteMutation, deleteNoteMutation } = useTaskNotesMutations(taskId);

  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  const handleDeleteConfirm = async () => {
    if (deletingNoteId) {
      await deleteNoteMutation.mutateAsync(deletingNoteId);
      setDeletingNoteId(null);
    }
  };

  const handleEditClick = (note: Note) => {
    setEditingNote({
      id: note.noteId,
      title: note.title,
      content: note.content,
    });
  };

  const handleSaveNewNote = async (title: string, content: string) => {
    await addNoteMutation.mutateAsync({ title, content });
    setIsAddModalOpen(false);
  };

  const handleSaveEditedNote = async (data: NoteEditData) => {
    await editNoteMutation.mutateAsync(data);
    setEditingNote(null);
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
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 pr-4">
            <p className="font-medium leading-tight">{formError.title}</p>
            {formError.details && formError.details.length > 0 && (
              <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                {formError.details.map((detailErr, idx) => (
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
        emptyMessage="Brak notatek dla tego zadania"
        onEditClick={handleEditClick}
        onAddClick={() => setIsAddModalOpen(true)}
        onDeleteClick={(note) => setDeletingNoteId(note.noteId)}
      />

      <EditNoteDialog
        isOpen={Boolean(editingNote)}
        onClose={() => setEditingNote(null)}
        note={editingNote}
        onSave={handleSaveEditedNote}
      />

      <AddNoteDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewNote}
        isLoading={addNoteMutation.isPending}
      />

      <DeleteNoteDialog
        isOpen={Boolean(deletingNoteId)}
        onClose={() => setDeletingNoteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteNoteMutation.isPending}
      />
    </>
  );
};
