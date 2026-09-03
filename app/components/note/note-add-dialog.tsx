import { useEffect, useState } from 'react';
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

interface NodeAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => Promise<void>;
  isLoading?: boolean;
}

export const NoteAddDialog: React.FC<NodeAddDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setFormError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
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
      await onSave(title.trim(), content.trim());
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback = responseData?.message || apiError.message || 'Nie udało się dodać notatki.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && handleClose()}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-blue-900">
            Dodaj nową notatkę
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-2">
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
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Tytuł
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
              placeholder="Wpisz tytuł notatki"
              maxLength={50}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium text-gray-700">
              Treść
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 min-h-30 resize-y"
              placeholder="Wpisz treść notatki..."
              maxLength={500}
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
