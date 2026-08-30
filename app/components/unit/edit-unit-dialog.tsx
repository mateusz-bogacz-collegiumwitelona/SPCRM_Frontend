import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Loader2 } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (unit) {
      setName(unit.name);
      setSymbol(unit.symbol);
      setBaseMultiplier(unit.baseMultiplier);
      setError(null);
    }
  }, [unit]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!unit) return;

    try {
      setError(null);
      await onSave({
        unitId: unit.id,
        name: name.trim(),
        symbol: symbol.trim(),
        baseMultiplier: Number(baseMultiplier),
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
          <DialogTitle className="text-blue-900 text-lg font-semibold">
            Edytuj jednostkę miary
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase"
            />
          </div>

          <div>
            <label htmlFor="currency-name" className="block text-xs font-medium text-gray-700 mb-1">
              Pełna nazwa jednostki *
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
