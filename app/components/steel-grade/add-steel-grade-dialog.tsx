import React, { useState } from 'react';
import type ApiError from '~/interfaces/api-error';
import { getErrorMessage } from '~/utils/error-mapper';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  type SteelGradeFormData,
  SteelGradeFormFields,
} from '~/components/steel-grade/steel-grade-form-fields';

export interface AddSteelGradePayload {
  name: string;
  standard?: string | null;
  density: number | null;
}

interface AddSteelGradeDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (data: AddSteelGradePayload) => Promise<void>;
  readonly isLoading?: boolean;
}

const initialFormState: SteelGradeFormData = {
  name: '',
  standard: '',
  density: '',
};

export const AddSteelGradeDialog: React.FC<AddSteelGradeDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<SteelGradeFormData>(initialFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFormData(initialFormState);
    setErrorMessage(null);
  };

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

    if (formData.density === '') {
      setErrorMessage('Gęstość jest wymagana');
      return;
    }

    const payload: AddSteelGradePayload = {
      name: formData.name.trim(),
      standard: formData.standard.trim() === '' ? null : formData.standard.trim(),
      density: Number(formData.density),
    };

    try {
      await onSave(payload);
      resetForm();
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
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-[#004a8f]">
            Dodaj gatunek stali
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
            idPrefix="add-steel-grade"
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
              {isLoading ? 'Zapisywanie...' : 'Dodaj gatunek'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
