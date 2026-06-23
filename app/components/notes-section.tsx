import type { NoteResponse } from '~/interfaces/ note-response';
import { MessageSquare } from 'lucide-react';

interface NotesSectionProps {
  notes?: NoteResponse[];
  isLoading: boolean;
  emptyMessage?: string;
}

export const NotesSection = ({
  notes,
  isLoading,
  emptyMessage = 'Brak notatek',
}: NotesSectionProps) => {
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
        <p className="text-center text-gray-500 text-sm py-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {notes?.map((note) => (
            <div key={note.noteId} className="border-l-2 border-[#004a8f] pl-4 py-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">
                  {note.authorFirstName} {note.authorLastName}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(note.createdAt).toLocaleDateString('pl-PL')}
                </span>
              </div>
              {/* Dodane wyświetlanie tytułu notatki */}
              <h4 className="font-semibold text-sm text-gray-800 mb-1">{note.title}</h4>
              <p className="text-sm text-gray-700">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
