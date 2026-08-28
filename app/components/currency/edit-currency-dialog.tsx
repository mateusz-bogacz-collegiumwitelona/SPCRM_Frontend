import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Loader2 } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currency) {
      setName(currency.name);
      setCode(currency.code);
      setDecimalPlaces(currency.decimalPlace);
      setError(null);
    }
  }, [currency]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currency) return;

    if (!name.trim() || !code.trim()) {
      setError('Nazwa i kod waluty nie mogą być puste.');
      return;
    }

    if (code.trim().length !== 3) {
      setError('Kod waluty musi składać się dokładnie z 3 liter.');
      return;
    }

    try {
      setError(null);
      await onSave({
        currencyId: currency.id,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        decimalPlaces: Number(decimalPlaces),
      });
      onClose();
    } catch {
      //
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25 bg-white">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-lg font-semibold">Edytuj walutę</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
              {error}
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
              required
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
              required
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
              onClick={onClose}
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
