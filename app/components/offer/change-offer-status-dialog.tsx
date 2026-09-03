import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react';

interface ChangeOfferStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStatus: 'Accepted' | 'Rejected') => Promise<void>;
  isLoading: boolean;
  targetStatus: 'Accepted' | 'Rejected' | null;
  offerName?: string;
}

export const ChangeOfferStatusDialog: React.FC<ChangeOfferStatusDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  targetStatus,
  offerName,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!targetStatus) return;
    try {
      setError(null);
      await onConfirm(targetStatus);
      handleClose();
    } catch (err: unknown) {
      setError(`Wystąpił błąd podczas zmiany statusu. ${(err as Error).message}`);
    }
  };

  const isAccepting = targetStatus === 'Accepted';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-105">
        <DialogHeader className="border-b border-gray-100 pb-4 flex flex-col items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mt-2 ${
              isAccepting ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}
          >
            {isAccepting ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            {isAccepting ? 'Akceptacja oferty' : 'Odrzucenie oferty'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Czy na pewno chcesz zmienić status oferty{' '}
            {offerName ? <strong>„{offerName}”</strong> : ''} na{' '}
            <strong className={isAccepting ? 'text-green-700' : 'text-red-700'}>
              {isAccepting ? 'Zaakceptowana' : 'Odrzucona'}
            </strong>
            ?
          </p>

          {isAccepting && (
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
              Zaakceptowanie oferty spowoduje automatyczne utworzenie nowej transakcji sprzedaży
              (Deal).
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
            onClick={handleConfirm}
            disabled={isLoading}
            className={`text-white flex items-center gap-2 ${
              isAccepting ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isAccepting ? 'Zaakceptuj ofertę' : 'Odrzuć ofertę'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
