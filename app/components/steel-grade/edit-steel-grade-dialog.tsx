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
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/api-error';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData || !isOpen) return;

    setFormData({
      name: initialData.name || '',
      standard: initialData.standard || '',
      density: initialData.density ?? '',
    });
    setErrorMessage(null);
  }, [initialData, isOpen]);

  const handleFieldChange = <K extends keyof SteelGradeFormData>(
    field: K,
    value: SteelGradeFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrorMessage('Nazwa jest wymagana');
      return;
    }

    if (!initialData) return;

    const payload: EditSteelGradePayload = {
      id: initialData.id,
      name: formData.name.trim(),
      standard: formData.standard.trim() === '' ? null : formData.standard.trim(),
      density: formData.density === '' ? null : Number(formData.density),
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback = (err as Error)?.message || 'Wystąpił błąd';
      setErrorMessage(getErrorMessage(code, fallback));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-[#004a8f]">
            Edytuj gatunek stali
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <SteelGradeFormFields
            formData={formData}
            onChange={handleFieldChange}
            idPrefix="edit-steel-grade"
          />

          <DialogFooter className="pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
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
