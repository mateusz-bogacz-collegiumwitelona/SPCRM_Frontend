import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Loader2 } from 'lucide-react';

export interface AddUnitRequestPayload {
  name: string;
  symbol: string;
  baseMultiplier: number;
}

interface AddUnitDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: AddUnitRequestPayload) => Promise<void>;
  readonly isLoading: boolean;
}

export function AddUnitDialog({ isOpen, onClose, onSave, isLoading }: AddUnitDialogProps) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [baseMultiplier, setBaseMultiplier] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setName('');
    setSymbol('');
    setBaseMultiplier(0);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || !symbol.trim()) {
      setError('Nazwa i symbol jednostki są wymagane.');
      return;
    }

    try {
      setError(null);
      await onSave({
        name: name.trim(),
        symbol: symbol.trim(),
        baseMultiplier: Number(baseMultiplier),
      });

      handleClose();
    } catch {
      //
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-106.25 bg-white">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-lg font-semibold">
            Dodaj nową jednostkę miary
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="unit-symbol" className="block text-xs font-medium text-gray-700 mb-1">
              Symbol (np. Kg, M3, dkg) *
            </label>
            <input
              type="text"
              maxLength={3}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Kg"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase"
              required
            />
          </div>

          <div>
            <label htmlFor="unit-name" className="block text-xs font-medium text-gray-700 mb-1">
              Pełna nazwa jednoski *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kilogram"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
          </div>

          <div>
            <label
              htmlFor="currency-base-multiplier"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Mnożnik (np. 1 dla podstawowej jednostki, 0.001 dla miligrama) *
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
                'Dodaj jednostkę'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
