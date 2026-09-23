import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, AlertTriangle, Loader2, ShieldCheck, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import { getRoleConfig } from '~/utils/role-translator';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export interface ChangeUserRolePayload {
  userId: string;
  role: string;
}

export interface UserToChangeRole {
  id: string;
  fullName: string;
  currentRole: string;
}

interface ChangeUserRoleDialogProps {
  readonly user: UserToChangeRole | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: ChangeUserRolePayload) => Promise<void>;
  readonly isLoading: boolean;
}

export function ChangeUserRoleDialog({
  user,
  isOpen,
  onClose,
  onSave,
  isLoading,
}: ChangeUserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const { data: roles = [], isLoading: isRolesLoading } = useQuery<string[]>({
    queryKey: ['system-roles'],
    queryFn: async () => {
      const response = await api.get('/user/roles');
      return response.data?.data || response.data?.value || response.data || [];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen && user) {
      setSelectedRole(user.currentRole || '');
      setFormError(null);
    }
  }, [isOpen, user]);

  const handleClose = () => {
    setSelectedRole('');
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    if (!selectedRole) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Wybór nowej roli jest wymagany.'],
      });
      return;
    }

    if (selectedRole.toLowerCase() === user.currentRole?.toLowerCase()) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Użytkownik posiada już przypisaną tę rolę.'],
      });
      return;
    }

    try {
      await onSave({
        userId: user.id,
        role: selectedRole,
      });
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zmienić roli użytkownika.';

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
      <DialogContent className="sm:max-w-115 bg-white">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <DialogTitle className="text-blue-900 text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-900" />
            Zmień rolę użytkownika
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
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
              Zmieniasz uprawnienia dla pracownika{' '}
              <strong className="font-semibold">{user.fullName}</strong>. Zmiana roli natychmiast
              unieważni dotychczasową sesję logowania użytkownika.
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="change-role-select" className="block text-xs font-medium text-gray-700">
              Nowa rola w systemie *
            </label>
            <select
              id="change-role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={isRolesLoading || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-700"
            >
              <option value="" disabled>
                {isRolesLoading ? 'Wczytywanie ról...' : 'Wybierz rolę...'}
              </option>
              {roles.map((r) => {
                const config = getRoleConfig(r);
                return (
                  <option key={r} value={r}>
                    {config.label}{' '}
                    {r.toLowerCase() === user.currentRole?.toLowerCase() ? '(aktualna)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <DialogFooter className="pt-3 border-t mt-4">
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
              disabled={isLoading || isRolesLoading || !selectedRole}
              className="bg-blue-900 text-white hover:bg-blue-800 text-xs h-9 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Zapisywanie...
                </>
              ) : (
                'Zapisz rolę'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
