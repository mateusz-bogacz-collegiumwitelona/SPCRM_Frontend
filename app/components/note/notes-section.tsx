import type { NoteResponse } from '~/interfaces/note-response';
import { AlertCircle, Edit2, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { ActionGuard } from '~/lib/action-guard';
import type { FormErrorState } from '~/interfaces/api-error';

interface NotesSectionProps {
  readonly notes?: NoteResponse[];
  readonly isLoading: boolean;
  readonly emptyMessage?: string;
  readonly error?: FormErrorState | null;
  readonly onErrorDismiss?: () => void;
  readonly onEditClick?: (note: NoteResponse) => void;
  readonly onAddClick?: () => void;
  readonly onDeleteClick?: (note: NoteResponse) => void;
}

export const NotesSection = ({
  notes,
  isLoading,
  emptyMessage = 'Brak notatek',
  error,
  onErrorDismiss,
  onEditClick,
  onAddClick,
  onDeleteClick,
}: NotesSectionProps) => {
  const renderNotesList = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-16 bg-gray-100 animate-pulse rounded" />
          <div className="h-16 bg-gray-100 animate-pulse rounded" />
        </div>
      );
    }

    if (!notes || notes.length === 0) {
      return <p className="text-center text-gray-500 text-sm py-4">{emptyMessage}</p>;
    }

    return (
      <div className="space-y-4">
        {notes.map((note) => (
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
                      type="button"
                      onClick={() => onEditClick(note)}
                      className="text-gray-400 hover:text-[#004a8f] transition-colors ml-2"
                      title="Edytuj notatkę"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </ActionGuard>
                )}

                {onDeleteClick && (
                  <ActionGuard authorId={note.authorId}>
                    <button
                      type="button"
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
            <h4 className="font-semibold text-sm text-gray-800 mb-1 wrap-break-word">
              {note.title}
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap wrap-break-word">
              {note.content}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-normal text-gray-800 flex items-center gap-2">
          <MessageSquare className="text-[#004a8f] w-5 h-5" /> Historia działań i notatki
        </h2>

        {onAddClick && (
          <Button
            type="button"
            onClick={onAddClick}
            size="sm"
            className="bg-[#004a8f] text-white hover:bg-blue-800 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Dodaj notatkę
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 pr-4">
            <p className="font-medium leading-tight">{error.title}</p>
            {error.details && error.details.length > 0 && (
              <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                {error.details.map((detailErr, idx) => (
                  <li key={idx}>{detailErr}</li>
                ))}
              </ul>
            )}
          </div>
          {onErrorDismiss && (
            <button
              type="button"
              onClick={onErrorDismiss}
              className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
              title="Zamknij"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {renderNotesList()}
    </div>
  );
};
