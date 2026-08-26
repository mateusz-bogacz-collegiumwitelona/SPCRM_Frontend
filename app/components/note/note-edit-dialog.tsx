import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';

export interface NoteEditData {
  id: string;
  title: string;
  content: string;
}

interface NoteEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteEditData | null;
  onSave: (data: NoteEditData) => Promise<void>;
}

export const NoteEditDialog: React.FC<NoteEditDialogProps> = ({
  isOpen,
  onClose,
  note,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (note && isOpen) {
      setTitle(note.title || '');
      setContent(note.content || '');
    }
  }, [note, isOpen]);

  if (!note) return null;

  const isTitleValid = title.trim().length > 0 && title.trim().length <= 50;
  const isContentValid = content.trim().length > 0 && content.trim().length <= 500;
  const isFormValid = isTitleValid && isContentValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setIsSubmitting(true);
      await onSave({
        id: note.id,
        title: title.trim(),
        content: content.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Błąd podczas zapisywania notatki:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <DialogTitle className="text-xl font-normal text-blue-900 leading-tight">
            Edytuj notatkę
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Tytuł <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              placeholder="Wprowadź tytuł"
            />
            <div className="text-right text-xs text-gray-500">{title.length}/50</div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="content" className="text-sm font-medium text-gray-700">
              Treść notatki <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              className="flex min-h-40 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#004a8f] resize-y"
              placeholder="Wpisz treść notatki..."
            />
            <div className="text-right text-xs text-gray-500">{content.length}/500</div>
          </div>

          <DialogFooter className="pt-4 border-t border-gray-100 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid}
              className="w-full sm:w-auto bg-[#004a8f] text-white hover:bg-blue-800"
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
