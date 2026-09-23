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
import { AlertCircle, AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import type { DeleteUserPayload, UserSimpleListResponse, UserToDelete } from '~/interfaces/user';

interface DeleteUserDialogProps {
  readonly user: UserToDelete | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onDelete: (payload: DeleteUserPayload) => Promise<void>;
  readonly isLoading?: boolean;
}

export const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  user,
  isOpen,
  onClose,
  onDelete,
  isLoading = false,
}) => {
  const [reassignToUserId, setReassignToUserId] = useState<string>('');
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

  const availableUsers = users.filter((u) => u.id !== user?.id);

  useEffect(() => {
    if (isOpen) {
      setReassignToUserId('');
      setFormError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setReassignToUserId('');
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    if (!reassignToUserId) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Wskaż użytkownika przejmującego zadania i powiązane rekordy.'],
      });
      return;
    }

    try {
      await onDelete({
        userId: user.id,
        reassignToUserId,
      });
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się usunąć użytkownika.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && handleClose()}>
      <DialogContent className="sm:max-w-125 bg-white">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="text-red-900 text-lg font-semibold flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            Usuń użytkownika (Soft delete)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
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

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              Konto pracownika <strong className="font-semibold">{user.fullName}</strong> zostanie
              oznaczone jako usunięte. Wszystkie jego aktywne firmy, kontakty, otwarte szanse
              sprzedaży oraz zadania zostaną automatycznie przekazane wyznaczonej osobie.
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label htmlFor="reassign-select" className="text-xs font-semibold text-gray-700">
              Przepisz wszystkie rekordy i zadania na *
            </label>
            <select
              id="reassign-select"
              value={reassignToUserId}
              onChange={(e) => setReassignToUserId(e.target.value)}
              disabled={isUsersLoading || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="" disabled>
                {isUsersLoading ? 'Wczytywanie listy pracowników...' : 'Wybierz pracownika...'}
              </option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-3 border-t mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 text-xs h-9"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUsersLoading || !reassignToUserId}
              className="bg-red-600 text-white hover:bg-red-700 text-xs h-9 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Usuwanie i przepisywanie...
                </>
              ) : (
                'Usuń i przepisz'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
