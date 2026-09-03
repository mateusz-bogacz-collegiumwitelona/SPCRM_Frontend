import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

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
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    if (note && isOpen) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setFormError(null);
    }
  }, [note, isOpen]);

  if (!note) return null;

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors: string[] = [];
    if (!title.trim()) validationErrors.push('Tytuł notatki jest wymagany.');
    if (title.trim().length > 50)
      validationErrors.push('Tytuł notatki nie może przekraczać 50 znaków.');
    if (!content.trim()) validationErrors.push('Treść notatki jest wymagana.');
    if (content.trim().length > 500)
      validationErrors.push('Treść notatki nie może przekraczać 500 znaków.');

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: note.id,
        title: title.trim(),
        content: content.trim(),
      });
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się edytować notatki.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && handleClose()}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <DialogTitle className="text-xl font-normal text-blue-900 leading-tight">
            Edytuj notatkę
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-4">
          {formError && (
            <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 pr-4">
                <p className="font-medium leading-tight">{formError.title}</p>
                {formError.details && formError.details.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                    {formError.details.map((detailErr, idx) => (
                      <li key={idx}>{detailErr}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                title="Zamknij"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[#004a8f] text-white hover:bg-blue-800 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
