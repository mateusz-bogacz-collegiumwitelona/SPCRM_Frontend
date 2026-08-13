import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Loader2, Star } from 'lucide-react';

interface SetPrimaryContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export const SetCompanyPrimaryContactDialog: React.FC<SetPrimaryContactDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader className="border-b border-gray-100 pb-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mt-2">
            <Star className="w-6 h-6 text-[#004a8f]" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Zmień główny kontakt
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
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
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-700 border-gray-300"
          >
            Anuluj
          </Button>
          <Button
            onClick={onConfirm}
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
