import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import { getRoleConfig } from '~/utils/role-translator';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export interface AddUserRequestPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AddUserDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: AddUserRequestPayload) => Promise<void>;
  readonly isLoading: boolean;
}

export function AddUserDialog({ isOpen, onClose, onSave, isLoading }: AddUserDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const { data: roles = [] } = useQuery<string[]>({
    queryKey: ['system-roles'],
    queryFn: async () => {
      const response = await api.get('/user/roles');
      return response.data?.data || response.data?.value || response.data || [];
    },
    enabled: isOpen,
  });

  const handleClose = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setRole('');
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors: string[] = [];
    if (!firstName.trim()) validationErrors.push('Imię jest wymagane.');
    if (!lastName.trim()) validationErrors.push('Nazwisko jest wymagane.');
    if (!email.trim()) {
      validationErrors.push('Adres e-mail jest wymagany.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      validationErrors.push('Wprowadzono niepoprawny format adresu e-mail.');
    }
    if (!role) validationErrors.push('Wybór roli w systemie jest wymagany.');

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role,
      });

      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się dodać użytkownika.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && handleClose()}>
      <DialogContent className="sm:max-w-120 bg-white">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-lg font-semibold">
            Dodaj nowego użytkownika
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="user-firstname"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Imię *
              </label>
              <input
                id="user-firstname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="np. Jan"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label
                htmlFor="user-lastname"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Nazwisko *
              </label>
              <input
                id="user-lastname"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="np. Kowalski"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="user-email" className="block text-xs font-medium text-gray-700 mb-1">
              Adres e-mail *
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jan.kowalski@firma.pl"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label
              htmlFor="user-role-select"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Rola w systemie *
            </label>
            <select
              id="user-role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-700"
            >
              <option value="">Wybierz rolę...</option>
              {roles.map((r) => {
                const config = getRoleConfig(r);
                return (
                  <option key={r} value={r}>
                    {config.label}
                  </option>
                );
              })}
            </select>
          </div>

          <DialogFooter className="pt-3 border-t">
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
              className="bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Dodawanie...
                </>
              ) : (
                'Dodaj użytkownika'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
