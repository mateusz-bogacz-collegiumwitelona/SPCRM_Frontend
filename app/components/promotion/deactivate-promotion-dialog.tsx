import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeactivatePromotionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  promotionName: string;
}

export const DeactivatePromotionDialog: React.FC<DeactivatePromotionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  promotionName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader className="border-b border-gray-100 pb-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 pb-4 flex items-center justify-center mt-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Dezaktywacja promocji
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Czy na pewno chcesz dezaktywować promocję{' '}
            {promotionName ? <strong>{promotionName}</strong> : 'tę promocję'}?
            <br />
            Data zakończenia promocji zostanie ustawiona ta teraz a zniżka przestanie być naliczana
            przy nowych ofertach i wycenach
          </p>
        </div>

        <DialogFooter className="flex justify-end gap-3 mt-2 sm:justify-end border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-700 border-gray-300"
          >
            Anuluj
          </Button>

          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Zakończ promocję
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
