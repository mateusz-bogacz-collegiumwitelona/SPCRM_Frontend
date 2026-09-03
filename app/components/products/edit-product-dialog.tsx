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
import { AlertCircle, Loader2, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import {
  type ProductFormData,
  ProductFormFields,
  useProductFormDictionaries,
} from '~/components/products/product-form-fields';

export interface EditProductRequest {
  productId: string;
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

interface EditProductDetailResponse {
  productId: string;
  name: string;
  steelGradeId: string;
  unitId: string;
  currencyId: string;
  category: string;
  thickness: number;
  width: number;
  length: number;
  diameter?: number | null;
  weight: number;
  pricePerUnit: number;
  stockQuantity: number;
}

interface EditProductDialogProps {
  readonly productId: string | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (productData: EditProductRequest) => Promise<void>;
  readonly isLoading?: boolean;
}

const defaultFormData: ProductFormData = {
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

export const EditProductDialog: React.FC<EditProductDialogProps> = ({
  productId,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const { data: productData, isLoading: isFetchingProduct } = useQuery<EditProductDetailResponse>({
    queryKey: ['product-for-edit', productId],
    queryFn: async () => {
      const res = await api.get(`/products/edit/${productId}`);
      return (res.data?.value || res.data?.data || res.data) as EditProductDetailResponse;
    },
    enabled: isOpen && Boolean(productId),
  });

  const { categories, steelGrades, units, currencies } = useProductFormDictionaries(isOpen);

  useEffect(() => {
    if (!productData) return;

    setFormData({
      name: productData.name ?? '',
      steelGradeId: productData.steelGradeId ?? '',
      thickness: productData.thickness ?? 0,
      width: productData.width ?? 0,
      length: productData.length ?? 0,
      diameter: productData.diameter ?? '',
      weight: productData.weight ?? 0,
      unitId: productData.unitId ?? '',
      currencyId: productData.currencyId ?? '',
      pricePerUnit: productData.pricePerUnit ?? 0,
      stockQuantity: productData.stockQuantity ?? 0,
      category: productData.category ?? '',
    });
    setFormError(null);
  }, [productData]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleFieldChange = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isDiameterRequired = formData.category === 'Pipe' || formData.category === 'Wire';

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!productId) return;

    const validationErrors: string[] = [];
    if (!formData.name.trim()) validationErrors.push('Nazwa produktu jest wymagana.');
    if (!formData.category) validationErrors.push('Kategoria produktu jest wymagana.');
    if (!formData.steelGradeId) validationErrors.push('Gatunek stali jest wymagany.');
    if (!formData.unitId) validationErrors.push('Jednostka miary jest wymagana.');
    if (!formData.currencyId) validationErrors.push('Waluta jest wymagana.');
    if (Number(formData.pricePerUnit) < 0)
      validationErrors.push('Cena jednostkowa nie może być ujemna.');
    if (Number(formData.stockQuantity) < 0)
      validationErrors.push('Stan magazynowy nie może być ujemny.');

    if (isDiameterRequired && (formData.diameter === '' || Number(formData.diameter) <= 0)) {
      validationErrors.push('Średnica jest wymagana dla kategorii Pipe oraz Wire.');
    }

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    const payload: EditProductRequest = {
      productId,
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
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zaktualizować produktu.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && handleClose()}>
      <DialogContent className="sm:max-w-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-[#004a8f]">Edytuj produkt</DialogTitle>
        </DialogHeader>

        {isFetchingProduct ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#004a8f]" />
            <p className="text-sm">Ładowanie danych produktu...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6 py-4">
            {formError && (
              <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
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

            <ProductFormFields
              formData={formData}
              onChange={handleFieldChange}
              categories={categories}
              steelGrades={steelGrades}
              units={units}
              currencies={currencies}
              isDiameterRequired={isDiameterRequired}
            />

            <DialogFooter className="pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#004a8f] text-white hover:bg-blue-800 flex items-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
