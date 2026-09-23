import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export interface EditCurrencyRequestPayload {
  currencyId: string;
  name?: string;
  code?: string;
  decimalPlaces?: number;
}

interface EditCurrencyDialogProps {
  readonly currency: {
    id: string;
    name: string;
    code: string;
    decimalPlace: number;
  } | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: EditCurrencyRequestPayload) => Promise<void>;
  readonly isLoading: boolean;
}

export function EditCurrencyDialog({
  currency,
  isOpen,
  onClose,
  onSave,
  isLoading,
}: EditCurrencyDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    if (currency && isOpen) {
      setName(currency.name);
      setCode(currency.code);
      setDecimalPlaces(currency.decimalPlace);
      setFormError(null);
    }
  }, [currency, isOpen]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!currency) return;

    const validationErrors: string[] = [];
    if (!code.trim()) validationErrors.push('Kod waluty jest wymagany.');
    if (code.trim().length !== 3)
      validationErrors.push('Kod waluty musi składać się dokładnie z 3 liter (np. PLN, EUR).');
    if (!name.trim()) validationErrors.push('Pełna nazwa waluty jest wymagana.');
    if (decimalPlaces < 0 || decimalPlaces > 4)
      validationErrors.push('Liczba miejsc po przecinku musi wynosić od 0 do 4.');

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    try {
      await onSave({
        currencyId: currency.id,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        decimalPlaces: Number(decimalPlaces),
      });
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const errorCode = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zaktualizować waluty.';

      setFormError({
        title: getErrorMessage(errorCode, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-106.25 bg-white">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-lg font-semibold">Edytuj walutę</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
          {formError && (
            <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
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
            <label htmlFor="currency-code" className="block text-xs font-medium text-gray-700 mb-1">
              Kod waluty *
            </label>
            <input
              type="text"
              maxLength={3}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase"
            />
          </div>

          <div>
            <label htmlFor="currency-name" className="block text-xs font-medium text-gray-700 mb-1">
              Nazwa waluty *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label
              htmlFor="currency-decimal-place"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Miejsca po przecinku
            </label>
            <input
              type="number"
              min={0}
              max={4}
              value={decimalPlaces}
              onChange={(e) => setDecimalPlaces(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300 text-gray-700"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-900 text-white hover:bg-blue-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Zapisywanie...
                </>
              ) : (
                'Zapisz zmiany'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
