import type { DictionaryItem, Task } from '~/interfaces/task';
import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Link } from 'react-router';
import { AlertCircle, Briefcase, Calendar, Clock, Loader2, User, X } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { api } from '~/api/api';
import { getTaskPriorityBadgeClass, getTaskStatusBadgeClass } from '~/utils/task-helpers';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { useTaskDictionaries } from '~/hooks/use-tasks';

interface TaskDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailDialog: React.FC<TaskDialogProps> = ({ task, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const {
    statuses,
    getStatusLabel,
    getPriorityLabel,
    isLoading: isDictLoading,
  } = useTaskDictionaries();

  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    if (task && isOpen) {
      setSelectedStatus(task.status);
      setFormError(null);
    } else {
      setSelectedStatus('');
      setFormError(null);
    }
  }, [task, isOpen]);

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!task) return;
      await api.put('/tasks/change-status', {
        taskId: task.id,
        status: newStatus,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      setFormError(null);
      onClose();
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback =
        apiError.response?.data?.message ||
        apiError.message ||
        'Nie udało się zmienić statusu zadania.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          apiError.response?.data?.errors && apiError.response.data.errors.length > 0
            ? apiError.response.data.errors
            : undefined,
      });
    },
  });

  if (!task) return null;

  const currentStatusNormalized = task.status ? task.status.toLowerCase() : '';
  const isCompleted = currentStatusNormalized === 'complete';
  const isOverdue = new Date(task.dueAt) < new Date() && !isCompleted;

  const handleStatusSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedStatus) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Proszę wybrać status zadania.'],
      });
      return;
    }

    if (selectedStatus === task.status) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Zadanie posiada już ten status. Wybierz inny status.'],
      });
      return;
    }

    await statusMutation.mutateAsync(selectedStatus);
  };

  const isFinalStatusSelected = selectedStatus === 'Complete' || selectedStatus === 'Break';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !statusMutation.isPending) {
          setFormError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-130 bg-white">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <div className="flex items-center justify-between gap-3 pr-6">
            <DialogTitle className="text-lg font-semibold text-blue-900 leading-tight">
              {task.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {formError && (
            <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-xs shadow-xs transition-all text-left">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/80 border border-gray-100 p-3 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Termin:</span>
              <span
                className={`font-medium ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-800'}`}
              >
                {format(new Date(task.dueAt), 'dd MMM yyyy, HH:mm', { locale: pl })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${getTaskStatusBadgeClass(task.status)}`}
              >
                {getStatusLabel(task.status)}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <span className="text-gray-500 pl-0.5">Priorytet:</span>
              <span
                className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getTaskPriorityBadgeClass(task.priority)}`}
              >
                {getPriorityLabel(task.priority)}
              </span>
            </div>
          </div>

          {!isCompleted ? (
            <form
              onSubmit={handleStatusSubmit}
              className="border border-gray-200 rounded-lg p-3.5 bg-white space-y-3"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="task-status-select"
                  className="text-xs font-semibold text-gray-700 block"
                >
                  Zmień status zadania:
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id="task-status-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    disabled={isDictLoading || statusMutation.isPending}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                  >
                    {statuses.map((st: DictionaryItem) => (
                      <option key={st.value} value={st.value}>
                        {st.label} {st.value === task.status ? '— (obecny)' : ''}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      statusMutation.isPending || !selectedStatus || selectedStatus === task.status
                    }
                    className="bg-blue-900 text-white hover:bg-blue-800 text-xs h-8 shrink-0 flex items-center gap-1.5"
                  >
                    {statusMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Zapisz
                  </Button>
                </div>
              </div>

              {isFinalStatusSelected && selectedStatus !== task.status && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 leading-tight">
                  <strong>Uwaga:</strong> Ustawienie statusu{' '}
                  <strong>{getStatusLabel(selectedStatus)}</strong> zablokuje dalszą modyfikację
                  tego zadania przez maszynę stanów.
                </div>
              )}
            </form>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs">
              <span>
                Zadanie zostało sfinalizowane. Maszyna stanów blokuje dalszą zmianę statusu.
              </span>
            </div>
          )}

          {(task.contactId || task.dealId) && (
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Powiązania
              </span>

              {task.contactId && (
                <div className="flex items-center gap-2 text-xs">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">Kontakt:</span>
                  <Link
                    to={`/contacts/${task.contactId}`}
                    className="font-medium text-blue-900 hover:underline"
                  >
                    {task.contactFirstName} {task.contactLastName}
                  </Link>
                </div>
              )}

              {task.dealId && (
                <div className="flex items-center gap-2 text-xs">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">Transakcja:</span>
                  <Link
                    to={`/sales/${task.dealId}`}
                    className="font-medium text-blue-900 hover:underline"
                  >
                    {task.dealName}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 mt-2 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-xs h-9">
            Zamknij
          </Button>
          <Link to={`/task/${task.id}`}>
            <Button className="w-full sm:w-auto bg-blue-900 text-white hover:bg-blue-800 text-xs h-9">
              Karta zadania
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};
