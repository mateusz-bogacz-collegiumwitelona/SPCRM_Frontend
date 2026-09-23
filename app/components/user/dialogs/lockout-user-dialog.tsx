import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Calendar } from '~/components/ui/calendar';
import { AlertCircle, AlertTriangle, Ban, CalendarIcon, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '~/utils/utils';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import type { SetLockoutPayload, UserToLockout } from '~/interfaces/user';

interface LockoutUserDialogProps {
  readonly user: UserToLockout | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onLockout: (payload: SetLockoutPayload) => Promise<void>;
  readonly isLoading: boolean;
}

export function LockoutUserDialog({
  user,
  isOpen,
  onClose,
  onLockout,
  isLoading,
}: LockoutUserDialogProps) {
  const [lockoutType, setLockoutType] = useState<'permanent' | 'temporary'>('permanent');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const handleClose = () => {
    setLockoutType('permanent');
    setSelectedDate(undefined);
    setSelectedTime('12:00');
    setFormError(null);
    setIsCalendarOpen(false);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    const validationErrors: string[] = [];
    let lockoutEndIso: string | null = null;

    if (lockoutType === 'temporary') {
      if (!selectedDate) {
        validationErrors.push('Wybierz datę zakończenia blokady z kalendarza.');
      } else {
        const [hoursStr, minutesStr] = selectedTime.split(':');
        const hours = Number(hoursStr) || 0;
        const minutes = Number(minutesStr) || 0;

        const combinedDate = new Date(selectedDate);
        combinedDate.setHours(hours, minutes, 0, 0);

        if (combinedDate <= new Date()) {
          validationErrors.push(
            'Wybrana data i godzina zakończenia blokady muszą być w przyszłości.',
          );
        } else {
          lockoutEndIso = combinedDate.toISOString();
        }
      }
    }

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    try {
      await onLockout({
        userId: user.id,
        lockoutEnd: lockoutEndIso,
      });
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zablokować użytkownika.';

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
          <DialogTitle className="text-red-900 text-lg font-semibold flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-600" />
            Zablokuj użytkownika
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

          <div className="p-3 bg-red-50/70 border border-red-100 rounded-lg text-xs text-red-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              Czy na pewno chcesz zablokować dostęp dla użytkownika{' '}
              <strong className="font-semibold">{user.fullName}</strong>? Po zablokowaniu konto nie
              będzie mogło się zalogować, a użytkownik otrzyma powiadomienie e-mail.
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">Typ blokady</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-xs transition-colors ${
                  lockoutType === 'permanent'
                    ? 'border-red-600 bg-red-50/50 text-red-900 font-medium'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="lockoutType"
                  value="permanent"
                  checked={lockoutType === 'permanent'}
                  onChange={() => setLockoutType('permanent')}
                  className="accent-red-600"
                />
                <span>Na stałe</span>
              </label>

              <label
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-xs transition-colors ${
                  lockoutType === 'temporary'
                    ? 'border-red-600 bg-red-50/50 text-red-900 font-medium'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="lockoutType"
                  value="temporary"
                  checked={lockoutType === 'temporary'}
                  onChange={() => setLockoutType('temporary')}
                  className="accent-red-600"
                />
                <span>Czasowo</span>
              </label>
            </div>
          </div>

          {lockoutType === 'temporary' && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Data zakończenia blokady *
                </label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal border-gray-300 text-xs h-9',
                        !selectedDate && 'text-gray-500',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 shrink-0" />
                      {selectedDate ? (
                        format(selectedDate, 'dd MMMM yyyy', { locale: pl })
                      ) : (
                        <span>Wybierz datę z kalendarza</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 z-100 bg-white shadow-lg border border-gray-200"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(day) => {
                        setSelectedDate(day);
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      locale={pl}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <label htmlFor="lockout-time" className="block text-xs font-medium text-gray-700">
                  Godzina zakończenia *
                </label>
                <input
                  id="lockout-time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>
          )}

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
              className="bg-red-600 text-white hover:bg-red-700 text-xs h-9 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Blokowanie...
                </>
              ) : (
                'Zablokuj konto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
