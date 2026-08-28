import React, { useEffect, useState } from 'react';
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
  type EditPromotionInitialData,
  mapInitialDataToSharedForm,
  PromotionSharedFields,
  type PromotionSharedFormData,
  resolvePromotionPricingPayload,
  usePromotionDictionaries,
} from '~/components/promotion/promotion-form-shared';

export interface EditPromotionRequestPayload {
  id: string;
  name?: string;
  startDate?: string | null;
  endDate?: string | null;
  discountPercentage?: number | null;
  promotionalPrice?: number | null;
  currencyId?: string | null;
  contactId?: string | null;
  minQuantity?: number | null;
  minWeight?: number | null;
}

interface EditPromotionDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: EditPromotionRequestPayload) => Promise<void>;
  readonly isLoading: boolean;
  readonly initialData: EditPromotionInitialData;
}

export const EditPromotionDialog: React.FC<EditPromotionDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  initialData,
}) => {
  const [name, setName] = useState(initialData.name);
  const [sharedForm, setSharedForm] = useState<PromotionSharedFormData>(() =>
    mapInitialDataToSharedForm(initialData),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { currencies, contacts } = usePromotionDictionaries(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    setName(initialData.name);
    setSharedForm(mapInitialDataToSharedForm(initialData));
    setErrorMessage(null);
  }, [isOpen, initialData]);

  useEffect(() => {
    if (currencies.length > 0 && !sharedForm.currencyId) {
      const matched = currencies.find((c) => c.code === initialData.currencyCode);
      setSharedForm((prev) => ({
        ...prev,
        currencyId: matched?.currencyId ?? currencies[0].currencyId,
      }));
    }
  }, [currencies, initialData.currencyCode, sharedForm.currencyId]);

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
    if (sharedForm.startDate && sharedForm.endDate && sharedForm.endDate < sharedForm.startDate) {
      setErrorMessage('Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.');
      return;
    }

    const { pricing, error } = resolvePromotionPricingPayload(sharedForm);
    if (error || !pricing) {
      setErrorMessage(error ?? 'Nieprawidłowe warunki cenowe.');
      return;
    }

    const payload: EditPromotionRequestPayload = {
      id: initialData.id,
      name: name.trim(),
      ...buildBasePromotionPayload(sharedForm),
      ...pricing,
    };

    await onSave(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="text-xl font-normal text-blue-900">Edytuj promocję</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="edit-promo-name" className="text-xs font-semibold text-gray-700">
              Nazwa promocji *
            </label>
            <input
              id="edit-promo-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
              required
            />
          </div>

          <PromotionSharedFields
            idPrefix="edit-promo"
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
              Zapisz zmiany
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
