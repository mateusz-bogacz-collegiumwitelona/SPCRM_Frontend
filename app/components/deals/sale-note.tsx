import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import type { NoteResponse } from '~/interfaces/ note-response';
import { NotesSection } from '~/components/notes-section';
import { useAddNote } from '~/hooks/use-add-note';
import { NoteAddDialog } from '~/components/note-add-dialog';
import { useState } from 'react';

export const SaleNote = ({ dealId }: { dealId: string }) => {
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: notes, isLoading } = useQuery<NoteResponse[]>({
    queryKey: ['deal-notes', dealId],
    queryFn: async () => {
      const response = await api.get(`/sales/${dealId}/notes`);
      return response.data.data;
    },
  });

  const { mutateAsync: addNoteAsync, isPending: isAdding } = useAddNote({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-notes', dealId] });
    },
  });

  const handleSaveNewNote = async (title: string, content: string) => {
    await addNoteAsync({
      targetId: dealId,
      title,
      content,
      noteType: 'Deal',
    });
  };

  return (
    <>
      <NotesSection
        notes={notes}
        isLoading={isLoading}
        emptyMessage="Brak notatek dla tego zadania"
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
