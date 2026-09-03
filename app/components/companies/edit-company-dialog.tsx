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
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/api-error';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setErrorMessage(null);
    }
  }, [companyData, isOpen]);

  const resetForm = () => {
    setName('');
    setNip('');
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!companyId) return;

    if (!name.trim() || !nip.trim()) {
      setErrorMessage('Nazwa firmy oraz NIP są polami wymaganymi.');
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
      const code = apiError.response?.data?.errorCode;
      const fallback = (err as Error)?.message || 'Nie udało się zaktualizować danych firmy.';
      setErrorMessage(getErrorMessage(code, fallback));
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
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{errorMessage}</p>
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
                required
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
                required
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
