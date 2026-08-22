import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Loader2, AlertCircle, UserCog } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/apiError';
import { translateRole } from '~/utils/role-translator';

interface OwnerResponse {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface ChangeContactOwnerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newOwnerId: string) => Promise<void>;
  isLoading?: boolean;
}

export const ChangeContactOwnerDialog: React.FC<ChangeContactOwnerDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: owners = [],
    isLoading: isOwnersLoading,
    isError: isOwnersError,
  } = useQuery({
    queryKey: ['available-owners'],
    queryFn: async () => {
      const res = await api.get('/contacts/available-owners');
      return res.data.data as OwnerResponse[];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedOwnerId('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedOwnerId) {
      setErrorMessage('Proszę wybrać nowego opiekuna z listy.');
      return;
    }

    try {
      await onSave(selectedOwnerId);
      onClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback = (err as Error)?.message || 'Nie udało się zmienić opiekuna.';
      setErrorMessage(getErrorMessage(code, fallback));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader className="border-b border-gray-100 pb-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mt-2">
            <UserCog className="w-6 h-6 text-blue-900" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Zmień opiekuna kontaktu
          </DialogTitle>
        </DialogHeader>

        {isOwnersLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#004a8f] mb-4" />
            <p className="text-gray-500 text-sm">Pobieranie listy pracowników...</p>
          </div>
        ) : isOwnersError ? (
          <div className="py-8 text-center text-red-500 text-sm font-medium">
            Nie udało się pobrać listy opiekunów. Spróbuj ponownie później.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4 pb-2">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Wybierz nowego opiekuna *</label>
              <select
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f] bg-white"
                required
              >
                <option value="" disabled>
                  -- Wybierz pracownika --
                </option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.firstName} {owner.lastName} ({translateRole(owner.role)})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Nowy opiekun uzyska pełny dostęp do zarządzania tym kontaktem.
              </p>
            </div>

            <DialogFooter className="border-t border-gray-100 pt-4 mt-2">
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
                disabled={isLoading || !selectedOwnerId}
                className="bg-[#004a8f] text-white hover:bg-blue-800 flex items-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Zapisz zmiany
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
