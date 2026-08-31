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
import { AlertCircle, CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '~/utils/utils';

interface ExtendOfferValidityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newDate?: Date) => Promise<void>;
  isLoading: boolean;
  offerName?: string;
  currentValidUntil?: string;
}

export const ExtendOfferValidityDialog: React.FC<ExtendOfferValidityDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  offerName,
  currentValidUntil,
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

  const handleQuickAddDays = (days: number) => {
    const base = new Date();
    const newDate = addDays(base, days);
    setSelectedDate(newDate);
    setError(null);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedDate && selectedDate <= new Date()) {
      setError('Nowa data ważności oferty musi być w przyszłości.');
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
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mt-2">
            <Clock className="w-6 h-6 text-[#004a8f]" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Przedłużenie ważności oferty
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Przedłużasz termin ważności oferty {offerName ? <strong>„{offerName}”</strong> : ''}.
            {currentValidUntil && (
              <span className="block text-xs text-gray-500 mt-1">
                Obecny termin: {format(new Date(currentValidUntil), 'dd MMMM yyyy', { locale: pl })}
              </span>
            )}
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAddDays(7)}
              className="text-xs text-[#004a8f] border-blue-200 bg-blue-50/50 hover:bg-blue-100"
            >
              +7 dni
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAddDays(14)}
              className="text-xs text-[#004a8f] border-blue-200 bg-blue-50/50 hover:bg-blue-100"
            >
              +14 dni
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAddDays(30)}
              className="text-xs text-[#004a8f] border-blue-200 bg-blue-50/50 hover:bg-blue-100"
            >
              +30 dni
            </Button>
          </div>

          <div className="space-y-1.5 pt-2">
            <label htmlFor="offer-new-valid-until" className="text-xs font-semibold text-gray-700">
              Nowa data ważności (opcjonalnie)
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="offer-new-valid-until"
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
                    <span>Wybierz datę lub zatwierdź domyślne (+7 dni)</span>
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
              disabled={isLoading}
              className="bg-[#004a8f] text-white hover:bg-[#003870] flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Przedłuż ważność
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
