import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { MessageSquare } from 'lucide-react';

interface TaskNoteResponse {
  noteId: string;
  title: string;
  content: string;
  authorFirstName: string;
  authorLastName: string;
  createdAt: string;
  updatedAt?: string;
}

export const TaskNote = ({ taskId }: { taskId: string }) => {
  const { data: notes, isLoading } = useQuery<TaskNoteResponse[]>({
    queryKey: ['task-notes', taskId],
    queryFn: async () => {
      const response = await api.get(`/tasks/${taskId}/notes`);
      return response.data.data;
    },
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-6">
      <h2 className="text-xl font-normal text-gray-800 mb-6 flex items-center gap-2">
        <MessageSquare className="text-[#004a8f] w-5 h-5" /> Historia działań i notatki
      </h2>

      {/* Miejsce na formularz dla nowej notatki */}
      <div className="mb-6 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center text-gray-500 text-sm">
        [Miejsce na formularz: Dodaj nową notatkę]
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-16 bg-gray-100 animate-pulse rounded"></div>
          <div className="h-16 bg-gray-100 animate-pulse rounded"></div>
        </div>
      ) : notes?.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-4">Brak notatek dla tego zadania.</p>
      ) : (
        <div className="space-y-4">
          {notes?.map((note: TaskNoteResponse) => (
            <div key={note.noteId} className="border-l-2 border-[#004a8f] pl-4 py-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">
                  {note.authorFirstName} {note.authorLastName}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(note.createdAt).toLocaleDateString('pl-PL')}
                </span>
              </div>
              <p className="text-sm text-gray-700">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
