import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, CheckSquare, Loader2, X } from 'lucide-react';
import { useTaskDictionaries } from '~/hooks/use-task-dictionaries';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import type { ChangeTaskStatusPayload, DictionaryItem } from '~/interfaces/task';

interface ChangeTaskStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ChangeTaskStatusPayload) => Promise<void>;
  isLoading?: boolean;
  taskId: string;
  taskTitle?: string;
  currentStatus: string;
}

export const ChangeTaskStatusDialog: React.FC<ChangeTaskStatusDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  taskId,
  taskTitle,
  currentStatus,
}) => {
  const { statuses, getStatusLabel, isLoading: isDictLoading } = useTaskDictionaries();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus);
      setFormError(null);
    } else {
      setSelectedStatus('');
      setFormError(null);
    }
  }, [isOpen, currentStatus]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedStatus) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Proszę wybrać status zadania.'],
      });
      return;
    }

    if (selectedStatus === currentStatus) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Zadanie posiada już ten status. Wybierz inny status.'],
      });
      return;
    }

    try {
      await onSave({
        taskId,
        status: selectedStatus,
      });
      onClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zmienić statusu zadania.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  const isFinalStatus = selectedStatus === 'Complete' || selectedStatus === 'Break';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader className="border-b border-gray-100 pb-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mt-2">
            <CheckSquare className="w-6 h-6 text-brand" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Zmień status zadania
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="py-4 space-y-4">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Zmieniasz status zadania {taskTitle ? <strong>„{taskTitle}”</strong> : ''}.
          </p>

          {formError && (
            <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
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

          <div className="space-y-1.5 pt-1">
            <label htmlFor="task-status-select" className="text-xs font-semibold text-gray-700">
              Wybierz nowy status *
            </label>
            <select
              id="task-status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={isDictLoading || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand bg-white"
              required
            >
              <option value="" disabled>
                -- Wybierz status --
              </option>
              {statuses.map((st: DictionaryItem) => (
                <option key={st.value} value={st.value}>
                  {st.label} {st.value === currentStatus ? '— (obecny)' : ''}
                </option>
              ))}
            </select>
          </div>

          {isFinalStatus && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
              <strong>Uwaga:</strong> Ustawienie statusu{' '}
              <strong>{getStatusLabel(selectedStatus)}</strong> zamknie zadanie i zablokuje dalszą
              edycję.
            </div>
          )}

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
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
              disabled={isLoading || !selectedStatus || selectedStatus === currentStatus}
              className="bg-brand text-white hover:bg-brand-hover flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Zapisz status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
