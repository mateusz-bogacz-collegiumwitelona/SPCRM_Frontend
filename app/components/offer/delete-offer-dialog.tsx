import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

interface DeleteOfferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoading: boolean;
  offerName?: string;
}

export const DeleteOfferDialog: React.FC<DeleteOfferDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  offerName,
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
      const fallback = responseData?.message || apiError.message || 'Nie udało się usunąć oferty.';

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
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mt-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Usuwanie oferty
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
            Czy na pewno chcesz usunąć ofertę {offerName ? <strong>„{offerName}”</strong> : ''}?{' '}
            <br />
            Oferta zostanie przeniesiona do archiwum (soft-delete). Tej operacji nie można cofnąć.
          </p>
        </div>

        <DialogFooter className="flex justify-end gap-3 mt-2 border-t border-gray-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-700 border-gray-300"
          >
            Anuluj
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Usuń ofertę
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
