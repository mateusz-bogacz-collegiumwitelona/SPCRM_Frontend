import type { Note, NoteEditData } from '~/types/note';
import { NotesSection } from '~/components/note/notes-section';
import { EditNoteDialog } from '~/components/note/dialogs/edit-note-dialog';
import { useState } from 'react';
import { AddNoteDialog } from '~/components/note/dialogs/add-note-dialog';
import { DeleteNoteDialog } from '~/components/note/dialogs/delete-note-dialog';

import { useTaskNotes, useTaskNotesMutations } from '~/hooks/use-notes';
import { QueryErrorBanner } from '~/components/ui/query-error-banner';

export const TaskNote = ({ taskId }: { taskId: string }) => {
  const [editingNote, setEditingNote] = useState<NoteEditData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const { data: notes, isLoading, error: queryError } = useTaskNotes(taskId);

  const { addNoteMutation, editNoteMutation, deleteNoteMutation } = useTaskNotesMutations(taskId);

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

  return (
    <>
      <QueryErrorBanner
        error={queryError}
        fallbackMessage="Nie udało się pobrać danych zamówienia."
        className="mb-6"
      />
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
