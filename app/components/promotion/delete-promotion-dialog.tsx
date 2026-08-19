import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeletePromotionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  promotionName?: string;
}

export const DeletePromotionDialog: React.FC<DeletePromotionDialogProps> = ({
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
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mt-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Usuwanie promocji
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Czy na pewno chcesz usunąć promocję{' '}
            {promotionName ? <strong>„{promotionName}”</strong> : 'tę promocję'}? <br />
            Rekord zostanie trwale usunięty z listy promocji i ofert.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-2 border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-700 border-gray-300"
          >
            Anuluj
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Usuń promocję
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
