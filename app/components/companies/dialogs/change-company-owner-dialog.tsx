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
import { AlertCircle, Loader2, UserCheck, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export interface UserSimpleListResponse {
  id: string;
  firstName: string;
  lastName: string;
}

interface ChangeCompanyOwnerDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (newOwnerId: string) => Promise<void>;
  readonly currentOwnerName?: string;
  readonly isLoading?: boolean;
}

export const ChangeCompanyOwnerDialog: React.FC<ChangeCompanyOwnerDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentOwnerName,
  isLoading = false,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const { data: users = [], isLoading: isUsersLoading } = useQuery<UserSimpleListResponse[]>({
    queryKey: ['users-simple-list'],
    queryFn: async () => {
      const res = await api.get('/user/simple');
      const list = res.data?.data ?? res.data?.value ?? res.data;
      return Array.isArray(list) ? list : [];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId('');
      setFormError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedUserId) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Wybierz nowego opiekuna z listy.'],
      });
      return;
    }

    try {
      await onSave(selectedUserId);
      onClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zmienić opiekuna firmy.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-112.5 bg-white">
        <DialogHeader className="border-b border-gray-100 pb-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mt-2">
            <UserCheck className="w-6 h-6 text-[#004a8f]" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Zmień opiekuna firmy
          </DialogTitle>
        </DialogHeader>

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

          {currentOwnerName && (
            <p className="text-xs text-gray-500">
              Aktualny opiekun: <strong className="text-gray-800">{currentOwnerName}</strong>
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="owner-select" className="text-xs font-medium text-gray-700">
              Nowy opiekun *
            </label>
            <select
              id="owner-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isUsersLoading || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
            >
              <option value="" disabled>
                {isUsersLoading ? 'Ładowanie listy pracowników...' : 'Wybierz opiekuna...'}
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-4 border-t mt-6">
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
              disabled={isLoading || isUsersLoading || !selectedUserId}
              className="bg-[#004a8f] text-white hover:bg-blue-800 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Zapisywanie...' : 'Przypisz opiekuna'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
