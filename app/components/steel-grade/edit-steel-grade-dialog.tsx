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
  type SteelGradeFormData,
  SteelGradeFormFields,
} from '~/components/steel-grade/steel-grade-form-fields';

export interface EditSteelGradePayload {
  id: string;
  name: string;
  standard?: string | null;
  density?: number | null;
}

interface EditSteelGradeDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (data: EditSteelGradePayload) => Promise<void>;
  readonly initialData: {
    id: string;
    name: string;
    standard?: string | null;
    density: number;
  } | null;
  readonly isLoading?: boolean;
}

const defaultFormState: SteelGradeFormData = {
  name: '',
  standard: '',
  density: '',
};

export const EditSteelGradeDialog: React.FC<EditSteelGradeDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<SteelGradeFormData>(defaultFormState);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  useEffect(() => {
    if (!initialData || !isOpen) return;

    setFormData({
      name: initialData.name || '',
      standard: initialData.standard || '',
      density: initialData.density ?? '',
    });
    setFormError(null);
  }, [initialData, isOpen]);

  const handleFieldChange = <K extends keyof SteelGradeFormData>(
    field: K,
    value: SteelGradeFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!initialData) return;

    const validationErrors: string[] = [];

    if (!formData.name.trim()) {
      validationErrors.push('Nazwa jest wymagana.');
    }

    if (formData.density !== '' && Number(formData.density) <= 0) {
      validationErrors.push('Gęstość musi być większa od zera.');
    }

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    const payload: EditSteelGradePayload = {
      id: initialData.id,
      name: formData.name.trim(),
      standard: formData.standard.trim() === '' ? null : formData.standard.trim(),
      density: formData.density === '' ? null : Number(formData.density),
    };

    try {
      await onSave(payload);
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zaktualizować gatunku stali.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-[#004a8f]">
            Edytuj gatunek stali
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-3">
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

          <SteelGradeFormFields
            formData={formData}
            onChange={handleFieldChange}
            idPrefix="edit-steel-grade"
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
      </DialogContent>
    </Dialog>
  );
};
