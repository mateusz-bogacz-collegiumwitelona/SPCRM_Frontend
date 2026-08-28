import { useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Loader2 } from 'lucide-react';

export interface AddCurrencyRequestPayload {
  name: string;
  code: string;
  decimalPlaces: number;
}

interface AddCurrencyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: AddCurrencyRequestPayload) => Promise<void>;
  isLoading: boolean;
}

export function AddCurrencyDialog({ isOpen, onClose, onSave, isLoading }: AddCurrencyDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setName('');
    setCode('');
    setDecimalPlaces(2);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !code.trim()) {
      setError('Nazwa i kod waluty są wymagane.');
      return;
    }

    if (code.trim().length !== 3) {
      setError('Kod waluty musi składać się z 3 znaków.');
      return;
    }

    try {
      setError(null);
      await onSave({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        decimalPlaces: Number(decimalPlaces),
      });
      handleClose();
    } catch {
      //
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-lg font-semibold">
            Dodaj nową walutę
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kod waluty (ISO 4217, np. PLN, EUR) *
            </label>
            <input
              type="text"
              maxLength={3}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="USD"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Pełna nazwa waluty *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dolar amerykański"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Miejsca po przecinku (0 - 4)
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
                'Dodaj walutę'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
