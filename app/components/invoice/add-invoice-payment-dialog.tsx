import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CalendarIcon, CreditCard, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { api } from '~/api/api';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { formatCurrency } from '~/utils/data-formatters';
import { cn } from '~/utils/utils';

interface AddInvoicePaymentDialogProps {
  readonly invoiceId: string;
  readonly remainingAmount: number;
  readonly currencyCode?: string;
  readonly decimalPlaces?: number;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const AddInvoicePaymentDialog: React.FC<AddInvoicePaymentDialogProps> = ({
  invoiceId,
  remainingAmount,
  currencyCode = 'PLN',
  decimalPlaces = 2,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const resetForm = () => {
    setAmount('');
    setPaymentDate(new Date());
    setReferenceNumber('');
    setNote('');
    setFormError(null);
    setIsCalendarOpen(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addPaymentMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = Math.round(Number(amount) * 10000);
      const payload = {
        amount: parsedAmount,
        paymentDate: paymentDate!.toISOString(),
        referenceNumber: referenceNumber.trim() || undefined,
        note: note.trim() || undefined,
      };
      return await api.post(`/invoice/${invoiceId}/payment`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoice-payments', invoiceId] });
      await queryClient.invalidateQueries({ queryKey: ['invoice-payment-summary', invoiceId] });
      await queryClient.invalidateQueries({ queryKey: ['invoice-detail', invoiceId] });
      await queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      handleClose();
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;
      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zarejestrować wpłaty.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors: string[] = [];
    const numAmount = Number(amount);

    if (!amount || Number.isNaN(numAmount) || numAmount <= 0) {
      validationErrors.push('Wprowadź prawidłową kwotę większą od zera.');
    }

    const amountInUnits = Math.round(numAmount * 10000);
    if (amountInUnits > remainingAmount) {
      validationErrors.push(
        `Kwota wpłaty nie może przekraczać pozostałego salda (${formatCurrency(remainingAmount, currencyCode, decimalPlaces)}).`,
      );
    }

    if (!paymentDate) {
      validationErrors.push('Wskaż datę zaksięgowania płatności.');
    }

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    addPaymentMutation.mutate();
  };

  const setMaxAmount = () => {
    setAmount((remainingAmount / 10000).toFixed(decimalPlaces));
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !addPaymentMutation.isPending && handleClose()}
    >
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-lg font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-900" />
            Zarejestruj wpłatę
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="payment-amount" className="block text-xs font-semibold text-gray-700">
                Kwota wpłaty ({currencyCode}) *
              </label>
              <button
                type="button"
                onClick={setMaxAmount}
                className="text-[11px] font-semibold text-blue-900 hover:underline"
              >
                Całość ({formatCurrency(remainingAmount, currencyCode, decimalPlaces)})
              </button>
            </div>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount / 10000}
              placeholder="np. 1500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Data zaksięgowania *
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal border-gray-300 h-10 text-sm bg-white',
                    !paymentDate && 'text-gray-400',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate
                    ? format(paymentDate, 'dd MMMM yyyy', { locale: pl })
                    : 'Wybierz datę'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-60 bg-white shadow-xl" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(d) => {
                    setPaymentDate(d);
                    setIsCalendarOpen(false);
                  }}
                  locale={pl}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label
              htmlFor="reference-number"
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Nr referencyjny / wyciągu
            </label>
            <Input
              id="reference-number"
              type="text"
              placeholder="np. PRZ/2026/09/123"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              maxLength={100}
              className="h-10 bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="payment-note"
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Notatka
            </label>
            <textarea
              id="payment-note"
              rows={2}
              placeholder="np. Wpłata zaliczki, przelew mBank..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white resize-none"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addPaymentMutation.isPending}
              className="border-gray-300 text-gray-700"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={addPaymentMutation.isPending}
              className="bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-2"
            >
              {addPaymentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Zarejestruj wpłatę
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
