import type { NoteResponse } from '~/interfaces/ note-response';
import { Edit2, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { ActionGuard } from '~/lib/action-guard';

interface NotesSectionProps {
  notes?: NoteResponse[];
  isLoading: boolean;
  emptyMessage?: string;
  onEditClick?: (note: NoteResponse) => void;
  onAddClick?: () => void;
  onDeleteClick?: (note: NoteResponse) => void;
}

export const NotesSection = ({
  notes,
  isLoading,
  emptyMessage = 'Brak notatek',
  onEditClick,
  onAddClick,
  onDeleteClick,
}: NotesSectionProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-6">
      <h2 className="text-xl font-normal text-gray-800 mb-6 flex items-center gap-2">
        <MessageSquare className="text-[#004a8f] w-5 h-5" /> Historia działań i notatki
      </h2>

      {onAddClick && (
        <Button
          onClick={onAddClick}
          size="sm"
          className="bg-[#004a8f] text-white hover:bg-blue-800 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Dodaj notatkę
        </Button>
      )}

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
                  {onEditClick && (
                    <ActionGuard authorId={note.authorId}>
                      <button
                        onClick={() => onEditClick(note)}
                        className="text-gray-400 hover:text-[#004a8f] transition-colors"
                        title="Edytuj notatkę"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </ActionGuard>
                  )}

                  {onDeleteClick && (
                    <ActionGuard authorId={note.authorId}>
                      <button
                        onClick={() => onDeleteClick(note)}
                        className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                        title="Usuń notatkę"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </ActionGuard>
                  )}
                </span>
              </div>
              <h4 className="font-semibold text-sm text-gray-800 mb-1">{note.title}</h4>
              <p className="text-sm text-gray-700">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
