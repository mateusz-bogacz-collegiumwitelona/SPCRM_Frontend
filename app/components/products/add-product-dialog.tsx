import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/api-error';
import {
  type ProductFormData,
  ProductFormFields,
  useProductFormDictionaries,
} from '~/components/products/product-form-fields';

export interface AddProductRequest {
  name: string;
  steelGradeId: string;
  thickness: number;
  width: number;
  length: number;
  diameter?: number | null;
  weight: number;
  unitId: string;
  currencyId: string;
  pricePerUnit: number;
  stockQuantity: number;
  category: string;
}

interface AddProductDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (productData: AddProductRequest) => Promise<void>;
  readonly isLoading?: boolean;
}

const initialFormState: ProductFormData = {
  name: '',
  steelGradeId: '',
  thickness: 0,
  width: 0,
  length: 0,
  diameter: '',
  weight: 0,
  unitId: '',
  currencyId: '',
  pricePerUnit: 0,
  stockQuantity: 0,
  category: '',
};

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ProductFormData>(initialFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { categories, steelGrades, units, currencies } = useProductFormDictionaries(isOpen);

  const handleFieldChange = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.steelGradeId ||
      !formData.category ||
      !formData.unitId ||
      !formData.currencyId
    ) {
      setErrorMessage('Proszę wypełnić wszystkie wymagane pola.');
      return;
    }

    const payload: AddProductRequest = {
      name: formData.name.trim(),
      steelGradeId: formData.steelGradeId,
      thickness: Number(formData.thickness),
      width: Number(formData.width),
      length: Number(formData.length),
      diameter: formData.diameter === '' ? null : Number(formData.diameter),
      weight: Number(formData.weight),
      unitId: formData.unitId,
      currencyId: formData.currencyId,
      pricePerUnit: Number(formData.pricePerUnit),
      stockQuantity: Number(formData.stockQuantity),
      category: formData.category,
    };

    try {
      await onSave(payload);
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback = (err as Error)?.message || 'Nie udało się dodać produktu.';
      setErrorMessage(getErrorMessage(code, fallback));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-[#004a8f]">
            Dodaj nowy produkt
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <ProductFormFields
            formData={formData}
            onChange={handleFieldChange}
            categories={categories}
            steelGrades={steelGrades}
            units={units}
            currencies={currencies}
          />

          <DialogFooter className="pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#004a8f] text-white hover:bg-blue-800"
            >
              {isLoading ? 'Zapisywanie...' : 'Dodaj produkt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
