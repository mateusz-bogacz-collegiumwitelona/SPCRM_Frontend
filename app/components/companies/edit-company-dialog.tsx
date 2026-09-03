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

export interface EditCompanyRequest {
  id: string;
  name?: string;
  nip?: string;
}

export interface EditCompanyDetailResponse {
  id: string;
  name: string;
  nip: string;
}

interface EditCompanyDialogProps {
  companyId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (companyData: EditCompanyRequest) => Promise<void>;
  isLoading?: boolean;
}

export const EditCompanyDialog: React.FC<EditCompanyDialogProps> = ({
  companyId,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const { data: companyData, isLoading: isCompanyLoading } = useQuery<EditCompanyDetailResponse>({
    queryKey: ['company-edit-details', companyId],
    queryFn: async () => {
      const res = await api.get(`/company/edit-detail/${companyId}`);
      return res.data?.data ?? res.data;
    },
    enabled: isOpen && !!companyId,
  });

  useEffect(() => {
    if (companyData && isOpen) {
      setName(companyData.name || '');
      setNip(companyData.nip || '');
      setFormError(null);
    }
  }, [companyData, isOpen]);

  const resetForm = () => {
    setName('');
    setNip('');
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!companyId) return;

    const validationErrors: string[] = [];
    if (!name.trim()) validationErrors.push('Nazwa firmy jest wymagana.');
    if (!nip.trim()) validationErrors.push('Numer NIP jest wymagany.');

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    const payload: EditCompanyRequest = {
      id: companyId,
      name: name.trim(),
      nip: nip.replace(/[\s-]/g, ''),
    };

    try {
      await onSave(payload);
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zaktualizować danych firmy.';

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
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-125 bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-[#004a8f]">
            Edytuj dane firmy
          </DialogTitle>
        </DialogHeader>

        {isCompanyLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#004a8f] mb-3" />
            <p className="text-gray-500 text-sm">Pobieranie szczegółów firmy...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 py-2">
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

            <div className="space-y-1.5">
              <label htmlFor="edit-company-name" className="text-xs font-medium text-gray-700">
                Nazwa firmy *
              </label>
              <input
                id="edit-company-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Wprowadź nazwę firmy"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-company-nip" className="text-xs font-medium text-gray-700">
                NIP *
              </label>
              <input
                id="edit-company-nip"
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="10 cyfr bez spacji i kresek"
                maxLength={13}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              />
            </div>

            <DialogFooter className="pt-4 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="border-gray-300 text-gray-700"
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#004a8f] text-white hover:bg-blue-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Zapisywanie...
                  </>
                ) : (
                  'Zapisz zmiany'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
