import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import type { NoteResponse } from '~/interfaces/ note-response';
import { NotesSection } from '~/components/notes-section';
import { useEditNote } from '~/hooks/use-edit-note';
import { NoteEditDialog, type NoteEditData } from '~/components/note-edit-dialog';
import { useState } from 'react';

export const TaskNote = ({ taskId }: { taskId: string }) => {
  const queryClient = useQueryClient();

  const [editingNote, setEditingNote] = useState<NoteEditData | null>(null);

  const { data: notes, isLoading } = useQuery<NoteResponse[]>({
    queryKey: ['task-notes', taskId],
    queryFn: async () => {
      const response = await api.get(`/tasks/${taskId}/notes`);
      return response.data.data;
    },
  });

  const { mutateAsync: editNoteAsync } = useEditNote({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-notes', taskId] });
    },
  });

  const handleEditClick = (note: NoteResponse) => {
    setEditingNote({
      id: note.noteId,
      title: note.title,
      content: note.content,
    });
  };

  return (
    <>
      <NotesSection
        notes={notes}
        isLoading={isLoading}
        emptyMessage="Brak notatek dla tego zadania"
        onEditClick={handleEditClick}
      />

      <NoteEditDialog
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        note={editingNote}
        onSave={editNoteAsync}
      />
    </>
  );
};
