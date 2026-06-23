import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import type { NoteResponse } from '~/interfaces/ note-response';
import { NotesSection } from '~/components/notes-section';

export const SaleNote = ({ dealId }: { dealId: string }) => {
  const { data: notes, isLoading } = useQuery<NoteResponse[]>({
    queryKey: ['deal-notes', dealId],
    queryFn: async () => {
      const response = await api.get(`/sales/${dealId}/notes`);
      return response.data.data;
    },
  });

  return (
    <NotesSection
      notes={notes}
      isLoading={isLoading}
      emptyMessage="Brak notatek dla tego zadania"
    />
  );
};
