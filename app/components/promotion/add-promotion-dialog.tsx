import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  buildBasePromotionPayload,
  defaultPromotionSharedState,
  PromotionSharedFields,
  type PromotionSharedFormData,
  resolvePromotionPricingPayload,
  usePromotionDictionaries,
} from '~/components/promotion/promotion-form-shared';

export interface AddPromotionRequestPayload {
  name: string;
  productId: string;
  startDate?: string | null;
  endDate?: string | null;
  discountPercentage?: number | null;
  promotionalPrice?: number | null;
  currencyId?: string | null;
  contactId?: string | null;
  minQuantity?: number | null;
  minWeight?: number | null;
}

interface ProductOption {
  productId: string;
  name: string;
  dimension: string;
  stockPrice: number;
}

interface AddPromotionDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: AddPromotionRequestPayload) => Promise<void>;
  readonly isLoading: boolean;
}

export const AddPromotionDialog: React.FC<AddPromotionDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
}) => {
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [sharedForm, setSharedForm] = useState<PromotionSharedFormData>(
    defaultPromotionSharedState,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { currencies, contacts } = usePromotionDictionaries(isOpen);

  const { data: products = [] } = useQuery<ProductOption[]>({
    queryKey: ['mailing-products-list'],
    queryFn: async () => {
      const res = await api.get('/mailing/products', { params: { PageNumber: 1, PageSize: 100 } });
      return res.data?.data?.items || [];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setProductId('');
    setSharedForm(defaultPromotionSharedState);
    setErrorMessage(null);
  }, [isOpen]);

  useEffect(() => {
    if (currencies.length > 0 && !sharedForm.currencyId) {
      setSharedForm((prev) => ({ ...prev, currencyId: currencies[0].currencyId }));
    }
  }, [currencies, sharedForm.currencyId]);

  const handleSharedChange = <K extends keyof PromotionSharedFormData>(
    field: K,
    value: PromotionSharedFormData[K],
  ) => {
    setSharedForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Nazwa promocji jest wymagana.');
      return;
    }
    if (!productId) {
      setErrorMessage('Wybierz produkt objęty promocją.');
      return;
    }
    if (sharedForm.startDate && sharedForm.endDate && sharedForm.endDate < sharedForm.startDate) {
      setErrorMessage('Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.');
      return;
    }

    const { pricing, error } = resolvePromotionPricingPayload(sharedForm);
    if (error || !pricing) {
      setErrorMessage(error ?? 'Nieprawidłowe warunki cenowe.');
      return;
    }

    const payload: AddPromotionRequestPayload = {
      name: name.trim(),
      productId,
      ...buildBasePromotionPayload(sharedForm),
      ...pricing,
    };

    await onSave(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="text-xl font-normal text-blue-900">
            Utwórz nową promocję
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="promo-name" className="text-xs font-semibold text-gray-700">
              Nazwa promocji *
            </label>
            <input
              id="promo-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Wiosenna Zniżka na Rury Precyzyjne"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="promo-product" className="text-xs font-semibold text-gray-700">
              Produkt *
            </label>
            <select
              id="promo-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
              required
            >
              <option value="">-- Wybierz produkt --</option>
              {products.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.name} ({p.dimension})
                </option>
              ))}
            </select>
          </div>

          <PromotionSharedFields
            idPrefix="promo"
            formData={sharedForm}
            onChange={handleSharedChange}
            currencies={currencies}
            contacts={contacts}
          />

          <DialogFooter className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-700 border-gray-300"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Utwórz promocję
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
