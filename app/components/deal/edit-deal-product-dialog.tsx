import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { AlertCircle, Loader2, Pencil, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { formatCurrency } from '~/utils/data-formatters';

interface DealProductItem {
  dealProductId: string;
  productId: string;
  name: string;
  dimensions?: string;
  quantity: number;
  unitSymbol: string;
  unitPrice: number;
  currencyCode: string;
}

interface EditDealProductDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly dealId: string;
  readonly product: DealProductItem | null;
  readonly currencyCode?: string;
}

export const EditDealProductDialog: React.FC<EditDealProductDialogProps> = ({
  isOpen,
  onClose,
  dealId,
  product,
  currencyCode = 'PLN',
}) => {
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(product.quantity);
      setUnitPrice(product.unitPrice / 10000);
      setFormError(null);
    }
  }, [isOpen, product]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!product) return;
      const payload = {
        dealProductId: product.dealProductId,
        quantity: Number(quantity),
        unitPrice: Math.round(Number(unitPrice) * 10000),
      };
      return await api.patch(`/sales/${dealId}/products`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['deal-products', dealId] });
      await queryClient.invalidateQueries({ queryKey: ['deal-info', dealId] });
      await queryClient.invalidateQueries({ queryKey: ['deals-list'] });
      handleClose();
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;
      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zaktualizować pozycji.';

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
    if (quantity <= 0) {
      validationErrors.push('Ilość musi być większa od zera.');
    }
    if (unitPrice < 0) {
      validationErrors.push('Cena jednostkowa nie może być ujemna.');
    }

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    editMutation.mutate();
  };

  if (!product) return null;

  const totalValue = (quantity || 0) * (unitPrice || 0);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !editMutation.isPending && handleClose()}
    >
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#004a8f] text-lg font-semibold flex items-center gap-2">
            <Pencil className="w-5 h-5 text-[#004a8f]" />
            Edycja pozycji w zamówieniu
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

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm font-bold text-gray-900">{product.name}</p>
            {product.dimensions && (
              <p className="text-xs text-gray-500 mt-0.5">Wymiary: {product.dimensions}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-quantity"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Ilość ({product.unitSymbol}) *
              </label>
              <Input
                id="edit-quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="h-10 bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="edit-unit-price"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Cena netto ({currencyCode}) *
              </label>
              <Input
                id="edit-unit-price"
                type="number"
                step="0.01"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="h-10 bg-white font-medium"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md flex justify-between items-center text-sm font-semibold text-[#004a8f]">
            <span>Nowa wartość pozycji:</span>
            <span>{formatCurrency(totalValue * 10000, currencyCode, 2)}</span>
          </div>

          <DialogFooter className="pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={editMutation.isPending}
              className="text-gray-700 border-gray-300"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={editMutation.isPending}
              className="bg-[#004a8f] text-white hover:bg-[#003870] flex items-center gap-2"
            >
              {editMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Zapisz zmiany
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
