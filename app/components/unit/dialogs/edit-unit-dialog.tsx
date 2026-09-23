import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export interface EditUnitRequestPayload {
  unitId: string;
  name?: string;
  symbol?: string;
  baseMultiplier?: number;
}

interface EditUnitDialogProps {
  readonly unit: {
    id: string;
    name: string;
    symbol: string;
    baseMultiplier: number;
  } | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: EditUnitRequestPayload) => Promise<void>;
  readonly isLoading: boolean;
}

export function EditUnitDialog({ unit, isOpen, onClose, onSave, isLoading }: EditUnitDialogProps) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [baseMultiplier, setBaseMultiplier] = useState(0);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  useEffect(() => {
    if (unit) {
      setName(unit.name);
      setSymbol(unit.symbol);
      setBaseMultiplier(unit.baseMultiplier);
      setFormError(null);
    }
  }, [unit]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!unit) return;

    const validationErrors: string[] = [];
    if (!symbol.trim()) validationErrors.push('Symbol jednostki jest wymagany.');
    if (!name.trim()) validationErrors.push('Pełna nazwa jednostki jest wymagana.');
    if (Number(baseMultiplier) < 0) validationErrors.push('Mnożnik nie może być ujemny.');

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    try {
      await onSave({
        unitId: unit.id,
        name: name.trim(),
        symbol: symbol.trim(),
        baseMultiplier: Number(baseMultiplier),
      });
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zaktualizować jednostki miary.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && handleClose()}>
      <DialogContent className="sm:max-w-106.25 bg-white">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-lg font-semibold">
            Edytuj jednostkę miary
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
            <label htmlFor="unit-symbol" className="block text-xs font-medium text-gray-700 mb-1">
              Symbol (np. Kg, M3, dkg) *
            </label>
            <input
              id="unit-symbol"
              type="text"
              maxLength={3}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase"
            />
          </div>

          <div>
            <label htmlFor="unit-name" className="block text-xs font-medium text-gray-700 mb-1">
              Pełna nazwa jednostki *
            </label>
            <input
              id="unit-name"
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
              Mnożnik
            </label>
            <input
              type="number"
              min={0}
              max={4}
              value={baseMultiplier}
              onChange={(e) => setBaseMultiplier(Number(e.target.value))}
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
