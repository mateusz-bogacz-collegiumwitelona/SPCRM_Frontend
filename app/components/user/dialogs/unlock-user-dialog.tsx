import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2, Unlock, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import type { UserToUnlock } from '~/interfaces/user';

interface UnlockUserDialogProps {
  readonly user: UserToUnlock | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onUnlock: (userId: string) => Promise<void>;
  readonly isLoading: boolean;
}

export function UnlockUserDialog({
  user,
  isOpen,
  onClose,
  onUnlock,
  isLoading,
}: UnlockUserDialogProps) {
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    try {
      await onUnlock(user.id);
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się odblokować użytkownika.';

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
        <DialogHeader>
          <DialogTitle className="text-green-900 text-lg font-semibold flex items-center gap-2">
            <Unlock className="w-5 h-5 text-green-600" />
            Odblokuj użytkownika
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
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

          <div className="p-3 bg-green-50/70 border border-green-200 rounded-lg text-xs text-green-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <div>
              Czy na pewno chcesz przywrócić dostęp dla użytkownika{' '}
              <strong className="font-semibold">{user.fullName}</strong>? Blokada konta zostanie
              usunięta, a użytkownik otrzyma powiadomienie e-mail o odblokowaniu.
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
              className="bg-green-700 text-white hover:bg-green-800 text-xs h-9 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Odblokowywanie...
                </>
              ) : (
                'Odblokuj konto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
