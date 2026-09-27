import { useState } from 'react';
import type { NoteEditData } from '~/types/note';
import { NotesSection } from '~/components/note/notes-section';
import { AddNoteDialog } from '~/components/note/dialogs/add-note-dialog';
import { DeleteNoteDialog } from '~/components/note/dialogs/delete-note-dialog';
import { EditNoteDialog } from '~/components/note/dialogs/edit-note-dialog';
import { useDealNotes, useDealNotesMutations } from '~/hooks/use-notes';
import { QueryErrorBanner } from '~/components/ui/query-error-banner';

export const DealNote = ({ dealId }: { dealId: string }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteEditData | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const { data: notes, isLoading, error: queryError } = useDealNotes(dealId);

  const { addNoteMutation, editNoteMutation, deleteNoteMutation } = useDealNotesMutations(dealId);

  const handleDeleteConfirm = async () => {
    if (deletingNoteId) {
      await deleteNoteMutation.mutateAsync(deletingNoteId);
      setDeletingNoteId(null);
    }
  };

  const handleSaveNewNote = async (title: string, content: string) => {
    await addNoteMutation.mutateAsync({ title, content });
    setIsAddModalOpen(false);
  };

  const handleSaveEditedNote = async (data: NoteEditData) => {
    await editNoteMutation.mutateAsync(data);
    setEditingNote(null);
  };

  return (
    <>
      <QueryErrorBanner
        error={queryError}
        fallbackMessage="Nie udało się pobrać listy notatek."
        className="mb-4"
      />

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
        isLoading={deleteNoteMutation.isPending}
      />
    </>
  );
};
