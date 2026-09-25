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
import { AlertCircle, Loader2, UserCog, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { translateRole } from '~/utils/role-translator';
import { useAuth } from '~/context/auth-context';

interface AssigneeResponse {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface ChangeTaskAssigneeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newAssigneeId: string) => Promise<void>;
  isLoading?: boolean;
  taskTitle?: string;
  currentAssigneeId?: string;
}

export const ChangeTaskAssigneeDialog: React.FC<ChangeTaskAssigneeDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  taskTitle,
  currentAssigneeId,
}) => {
  const { user } = useAuth();
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const {
    data: rawAssignees = [],
    isLoading: isAssigneesLoading,
    isError: isAssigneesError,
  } = useQuery({
    queryKey: ['available-assignees'],
    queryFn: async () => {
      const res = await api.get('/contacts/available-owners');
      return (res.data?.data || res.data?.value || res.data) as AssigneeResponse[];
    },
    enabled: isOpen,
  });

  const currentLoggedInUserId = user?.userId;
  const assignees = rawAssignees.filter((assignee) => assignee.id !== currentLoggedInUserId);

  useEffect(() => {
    if (isOpen) {
      setSelectedAssigneeId(
        currentAssigneeId && currentAssigneeId !== currentLoggedInUserId ? currentAssigneeId : '',
      );
      setFormError(null);
    } else {
      setSelectedAssigneeId('');
      setFormError(null);
    }
  }, [isOpen, currentAssigneeId, currentLoggedInUserId]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedAssigneeId) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Proszę wybrać pracownika z listy.'],
      });
      return;
    }

    if (currentAssigneeId && selectedAssigneeId === currentAssigneeId) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Wybrany pracownik jest już przypisany do tego zadania.'],
      });
      return;
    }

    try {
      await onSave(selectedAssigneeId);
      onClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zmienić przypisanej osoby.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  const renderContent = () => {
    if (isAssigneesLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#004a8f] mb-4" />
          <p className="text-gray-500 text-sm">Pobieranie listy pracowników...</p>
        </div>
      );
    }

    if (isAssigneesError) {
      return (
        <div className="py-8 text-center text-red-500 text-sm font-medium">
          Nie udało się pobrać listy pracowników. Spróbuj ponownie później.
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} noValidate className="space-y-6 pt-4 pb-2">
        {taskTitle && (
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Zmieniasz osobę odpowiedzialną za zadanie <strong>„{taskTitle}”</strong>.
          </p>
        )}

        {formError && (
          <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 pr-4">
              <p className="font-medium leading-tight">{formError.title}</p>
              {formError.details && formError.details.length > 0 && (
                <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                  {formError.details.map((detailErr, idx) => (
                    <li key={`${detailErr}-${idx}`}>{detailErr}</li>
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

        <div className="space-y-2">
          <label htmlFor="new-task-assignee" className="text-sm font-medium text-gray-700">
            Wybierz nowego przypisanego pracownika *
          </label>
          <select
            id="new-task-assignee"
            value={selectedAssigneeId}
            onChange={(e) => setSelectedAssigneeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f] bg-white"
            required
          >
            <option value="" disabled>
              -- Wybierz pracownika --
            </option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.firstName} {assignee.lastName} ({translateRole(assignee.role)})
                {assignee.id === currentAssigneeId ? ' — (obecnie przypisany)' : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Nowo przypisany pracownik zobaczy to zadanie w swoim kalendarzu i liście zadań.
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
            disabled={isLoading || !selectedAssigneeId}
            className="bg-[#004a8f] text-white hover:bg-blue-800 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Zapisz zmiany
          </Button>
        </DialogFooter>
      </form>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader className="border-b border-gray-100 pb-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mt-2">
            <UserCog className="w-6 h-6 text-[#004a8f]" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Zmień przypisanego pracownika
          </DialogTitle>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
