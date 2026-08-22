import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { AlertCircle, CalendarIcon, Loader2, Play } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '~/utils/utils';

interface ActivatePromotionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (endDate: Date) => Promise<void>;
  isLoading: boolean;
  promotionName?: string;
}

export const ActivatePromotionDialog: React.FC<ActivatePromotionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  promotionName,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setSelectedDate(undefined);
    setError(null);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetState();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setError('Wybierz nową datę zakończenia promocji.');
      return;
    }

    if (selectedDate <= new Date()) {
      setError('Data zakończenia promocji musi być w przyszłości.');
      return;
    }

    setError(null);
    await onConfirm(selectedDate);
    resetState();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader className="border-b border-gray-100 pb-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mt-2">
            <Play className="w-6 h-6 text-green-600 ml-0.5" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Aktywacja promocji
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Wznawiasz promocję {promotionName ? <strong>„{promotionName}”</strong> : 'tę promocję'}.
            Wybierz nową datę zakończenia jej obowiązywania:
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-gray-700">Nowa data zakończenia *</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal border-gray-300 text-sm py-2 h-auto',
                    !selectedDate && 'text-gray-500',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {selectedDate ? (
                    <span>{format(selectedDate, 'dd MMMM yyyy', { locale: pl })}</span>
                  ) : (
                    <span>Wybierz datę z kalendarza</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-100" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date <= new Date()}
                  locale={pl}
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
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
              type="submit"
              disabled={isLoading || !selectedDate}
              className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Aktywuj promocję
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
