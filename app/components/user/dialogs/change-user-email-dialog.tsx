import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Info, Loader2, Mail, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import type { ChangeUserEmailPayload, UserToChangeEmail } from '~/interfaces/user';

interface ChangeUserEmailDialogProps {
  readonly user: UserToChangeEmail | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: ChangeUserEmailPayload) => Promise<void>;
  readonly isLoading: boolean;
}

export function ChangeUserEmailDialog({
  user,
  isOpen,
  onClose,
  onSave,
  isLoading,
}: ChangeUserEmailDialogProps) {
  const [newEmail, setNewEmail] = useState('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewEmail('');
      setFormError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setNewEmail('');
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    const trimmedEmail = newEmail.trim();
    const validationErrors: string[] = [];

    if (!trimmedEmail) {
      validationErrors.push('Nowy adres e-mail jest wymagany.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      validationErrors.push('Wprowadzono niepoprawny format adresu e-mail.');
    }

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
        newEmail: trimmedEmail,
      });
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message ||
        apiError.message ||
        'Nie udało się zainicjować zmiany adresu e-mail.';

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
            <Mail className="w-5 h-5 text-blue-900" />
            Zmień adres e-mail
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
                      <li key={`${detailErr}-${idx}`}>{detailErr}</li>
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

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              Zmieniasz adres e-mail dla pracownika{' '}
              <strong className="font-semibold">{user.fullName}</strong>. Na nowy adres zostanie
              wysłany link aktywacyjny, a na dotychczasowy powiadomienie bezpieczeństwa.
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="change-user-email" className="block text-xs font-medium text-gray-700">
              Nowy adres e-mail *
            </label>
            <input
              id="change-user-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nowy.adres@firma.pl"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Wysyłanie...
                </>
              ) : (
                'Zmień e-mail'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
