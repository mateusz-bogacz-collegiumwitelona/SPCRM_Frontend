import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Loader2, Star, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

interface SetPrimaryContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoading: boolean;
}

export const SetCompanyPrimaryContactDialog: React.FC<SetPrimaryContactDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleConfirm = async () => {
    setFormError(null);
    try {
      await onConfirm();
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zmienić głównego kontaktu.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && handleClose()}>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader className="border-b border-gray-100 pb-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mt-2">
            <Star className="w-6 h-6 text-[#004a8f]" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Zmień główny kontakt
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-3">
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

          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Czy na pewno chcesz ustawić tę osobę jako <strong>główny kontakt</strong> dla tej firmy?
            <br className="mb-2" />
            Poprzedni kontakt główny (jeśli istnieje) zostanie automatycznie oznaczony jako kontakt
            dodatkowy.
          </p>
        </div>

        <DialogFooter className="flex justify-end gap-3 mt-2 sm:justify-end border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-700 border-gray-300"
          >
            Anuluj
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-[#004a8f] text-white hover:bg-blue-800 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Ustaw jako główny
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
