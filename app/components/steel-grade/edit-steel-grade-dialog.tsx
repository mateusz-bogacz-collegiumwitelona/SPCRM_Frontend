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

export interface EditSteelGradePayload {
  id: string;
  name: string;
  standard?: string | null;
  density?: number | null;
}

interface EditSteelGradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditSteelGradePayload) => Promise<void>;
  initialData: {
    id: string;
    name: string;
    standard?: string | null;
    density: number;
  } | null;
  isLoading?: boolean;
}

export const EditSteelGradeDialog: React.FC<EditSteelGradeDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [standard, setStandard] = useState('');
  const [density, setDensity] = useState<number | ''>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && isOpen) {
      setName(initialData.name || '');
      setStandard(initialData.standard || '');
      setDensity(initialData.density ?? '');
      setErrorMessage(null);
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage('Nazwa jest wymagana');
      return;
    }

    if (!initialData) return;

    const payload: EditSteelGradePayload = {
      id: initialData.id,
      name: name.trim(),
      standard: standard.trim() === '' ? null : standard.trim(),
      density: density === '' ? null : Number(density),
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

          <div className="space-y-1.5">
            <label htmlFor="steel-grade-name" className="text-sm font-medium text-gray-700">
              Nazwa gatunku *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. S355J2, 1.4301"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="steel-grade-standard" className="text-sm font-medium text-gray-700">
              Norma
            </label>
            <input
              type="text"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              placeholder="np. EN 10025-2, DIN 17100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="steel-grade-density" className="text-sm font-medium text-gray-700">
              Gęstość (g/cm³)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={density}
              onChange={(e) => setDensity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="np. 7.85"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
            />
          </div>

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
