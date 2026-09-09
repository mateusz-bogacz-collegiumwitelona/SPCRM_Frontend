import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Loader2, UserCog, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export interface EditUserRequestPayload {
  userId: string;
  firstName?: string;
  lastName?: string;
}

export interface UserToEdit {
  id: string;
  firstName: string;
  lastName: string;
}

interface EditUserDialogProps {
  readonly user: UserToEdit | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: EditUserRequestPayload) => Promise<void>;
  readonly isLoading: boolean;
}

export function EditUserDialog({ user, isOpen, onClose, onSave, isLoading }: EditUserDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setFormError(null);
    }
  }, [user, isOpen]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    const validationErrors: string[] = [];
    if (!trimmedFirstName) validationErrors.push('Imię jest wymagane.');
    if (!trimmedLastName) validationErrors.push('Nazwisko jest wymagane.');

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    try {
      await onSave({
        userId: user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się dodać użytkownika.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && handleClose()}>
      <DialogContent className="sm:max-w-115 bg-white">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <DialogTitle className="text-blue-900 text-lg font-semibold flex items-center gap-2">
            <UserCog className="w-5 h-5 text-blue-900" />
            Edytuj dane użytkownika
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
          {formError && (
            <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
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

          <div className="space-y-3">
            <div>
              <label
                htmlFor="edit-user-firstname"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Imię *
              </label>
              <input
                id="edit-user-firstname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Imię pracownika"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label
                htmlFor="edit-user-lastname"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Nazwisko *
              </label>
              <input
                id="edit-user-lastname"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nazwisko pracownika"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 text-xs h-9"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-900 text-white hover:bg-blue-800 text-xs h-9 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Zapisywanie...
                </>
              ) : (
                'Zapisz zmiany'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
