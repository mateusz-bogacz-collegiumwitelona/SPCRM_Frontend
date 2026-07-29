import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import type { NoteResponse } from '~/interfaces/ note-response';
import { NotesSection } from '~/components/notes-section';
import { useEditNote } from '~/hooks/use-edit-note';
import { NoteEditDialog, type NoteEditData } from '~/components/note-edit-dialog';
import { useState } from 'react';
import { useAddNote } from '~/hooks/use-add-note';
import { NoteAddDialog } from '~/components/note-add-dialog';

export const TaskNote = ({ taskId }: { taskId: string }) => {
  const queryClient = useQueryClient();

  const [editingNote, setEditingNote] = useState<NoteEditData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const { mutateAsync: addNoteAsync, isPending: isAdding } = useAddNote({
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

  const handleSaveNewNote = async (title: string, content: string) => {
    await addNoteAsync({
      targetId: taskId,
      title,
      content,
      noteType: 'Task',
    });
  };

  return (
    <>
      <NotesSection
        notes={notes}
        isLoading={isLoading}
        emptyMessage="Brak notatek dla tego zadania"
        onEditClick={handleEditClick}
        onAddClick={() => setIsAddModalOpen(true)}
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
    </>
  );
};
