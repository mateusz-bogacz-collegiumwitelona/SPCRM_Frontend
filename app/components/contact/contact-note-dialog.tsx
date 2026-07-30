import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';

export interface ContactNote {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
  createdAt: string;
}

interface ContactNoteDialogProps {
  note: ContactNote | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContactNoteDialog: React.FC<ContactNoteDialogProps> = ({ note, isOpen, onClose }) => {
  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <DialogTitle className="text-xl font-normal text-blue-900 leading-tight">
            {note.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            <div className="flex items-center gap-1.5 mb-2 sm:mb-0">
              <span className="font-medium text-gray-700">Autor:</span>
              {note.authorFirstName} {note.authorLastName}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-gray-700">Dodano:</span>
              {note.createdAt && new Date(note.createdAt).toLocaleString('pl-PL')}
            </div>
          </div>

          <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {note.content}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Zamknij
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
