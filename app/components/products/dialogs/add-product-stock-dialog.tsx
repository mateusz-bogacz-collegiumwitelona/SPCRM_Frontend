import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Boxes, Loader2, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

interface AddProductStockDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (quantityToAdd: number) => Promise<void>;
  readonly isLoading?: boolean;
  readonly product: {
    id: string;
    name: string;
    currentStock: number;
    unitSymbol: string;
  } | null;
}

export const AddProductStockDialog: React.FC<AddProductStockDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  product,
}) => {
  const [quantity, setQuantity] = useState<string>('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setFormError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setFormError(null);
    setQuantity('');
    onClose();
  };

  const parsedQuantity = Number(quantity);
  const newProjectedStock = product ? product.currentStock + Math.max(parsedQuantity, 0) : 0;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!quantity || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Wprowadzona ilość musi być liczbą całkowitą większą od zera.'],
      });
      return;
    }

    if (!Number.isInteger(parsedQuantity)) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Ilość musi być liczbą całkowitą.'],
      });
      return;
    }

    try {
      await onSave(parsedQuantity);
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zwiększyć stanu magazynowego.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && handleClose()}>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader className="border-b border-gray-100 pb-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mt-2">
            <Boxes className="w-6 h-6 text-blue-900" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Przyjęcie dostawy towaru
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 pt-4 pb-2">
          {formError && (
            <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 pr-4">
                <p className="font-medium leading-tight">{formError.title}</p>
                {formError.details && formError.details.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                    {formError.details.map((detailErr, idx) => (
                      <li key={`${detailErr}-${idx}`}>{detailErr}</li>
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

          {product && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="font-semibold text-slate-800 text-sm">{product.name}</div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Aktualny stan magazynowy:</span>
                <span className="font-medium text-slate-900">
                  {product.currentStock} {product.unitSymbol}
                </span>
              </div>
              {parsedQuantity > 0 && (
                <div className="flex justify-between items-center text-blue-900 font-semibold border-t border-slate-200 pt-1.5 mt-1.5">
                  <span>Nowy stan po dostawie:</span>
                  <span>
                    {newProjectedStock} {product.unitSymbol}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="quantity-to-add" className="text-sm font-medium text-gray-700">
              Ilość z dostawy do dodania *
            </label>
            <input
              id="quantity-to-add"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="np. 25"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              required
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Podana wartość zostanie dodana do bieżącej ilości w magazynie.
            </p>
          </div>

          <DialogFooter className="border-t border-gray-100 pt-4 mt-2">
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
              disabled={isLoading || !quantity || parsedQuantity <= 0}
              className="bg-[#004a8f] text-white hover:bg-blue-800 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Przyjmij dostawę
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
