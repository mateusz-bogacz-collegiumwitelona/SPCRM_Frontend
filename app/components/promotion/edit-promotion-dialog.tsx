import React, { useEffect, useState } from 'react';
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
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const { currencies, contacts } = usePromotionDictionaries(isOpen);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    setName(initialData.name);
    setSharedForm(mapInitialDataToSharedForm(initialData));
    setFormError(null);
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
    setFormError(null);

    const validationErrors: string[] = [];

    if (!name.trim()) {
      validationErrors.push('Nazwa promocji jest wymagana.');
    }
    if (sharedForm.startDate && sharedForm.endDate && sharedForm.endDate < sharedForm.startDate) {
      validationErrors.push('Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.');
    }

    const { pricing, error } = resolvePromotionPricingPayload(sharedForm);
    if (error || !pricing) {
      validationErrors.push(error ?? 'Nieprawidłowe warunki cenowe.');
    }

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    const payload: EditPromotionRequestPayload = {
      id: initialData.id,
      name: name.trim(),
      ...buildBasePromotionPayload(sharedForm),
      ...pricing!,
    };

    try {
      await onSave(payload);
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zaktualizować promocji.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && handleClose()}>
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="text-xl font-normal text-blue-900">Edytuj promocję</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 py-4">
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
              onClick={handleClose}
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
