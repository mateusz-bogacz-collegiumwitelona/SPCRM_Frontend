import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import { useTaskDictionaries } from '~/hooks/use-task-dictionaries';
import { FALLBACK_TASK_PRIORITY_LABELS } from '~/utils/task-helpers';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import type { DictionaryItem, EditTaskRequestPayload } from '~/interfaces/task';

interface EditTaskDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly taskId: string | null;
  readonly onSave: (taskId: string, payload: EditTaskRequestPayload) => Promise<void>;
  readonly isLoading?: boolean;
}

interface TaskDetailData {
  id: string;
  title: string;
  description?: string;
  priority: string;
}

export function EditTaskDialog({
  isOpen,
  onClose,
  taskId,
  onSave,
  isLoading = false,
}: EditTaskDialogProps) {
  const { dictionaries, isLoading: isDictionariesLoading } = useTaskDictionaries();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const { data: taskDetail, isLoading: isTaskLoading } = useQuery<TaskDetailData>({
    queryKey: ['task-detail', taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}`);
      return res.data?.data || res.data?.value || res.data;
    },
    enabled: isOpen && Boolean(taskId),
  });

  useEffect(() => {
    if (taskDetail) {
      setTitle(taskDetail.title || '');
      setDescription(taskDetail.description || '');
      setPriority(taskDetail.priority || 'Medium');
      setFormError(null);
    }
  }, [taskDetail]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!taskId) return;
    setFormError(null);

    const validationErrors: string[] = [];
    if (!title.trim()) validationErrors.push('Tytuł zadania jest wymagany.');
    if (!description.trim()) validationErrors.push('Opis zadania jest wymagany.');
    if (!priority) validationErrors.push('Wybierz priorytet zadania.');

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    try {
      await onSave(taskId, {
        title: title.trim(),
        description: description.trim(),
        priority,
      });
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;
      const errorCode = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zaktualizować zadania.';

      setFormError({
        title: getErrorMessage(errorCode, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  const priorityOptions: DictionaryItem[] =
    dictionaries?.priorities && dictionaries.priorities.length > 0
      ? dictionaries.priorities
      : Object.entries(FALLBACK_TASK_PRIORITY_LABELS).map(([val, label]) => ({
          value: val.charAt(0).toUpperCase() + val.slice(1),
          label,
        }));

  const isFormDisabled = isLoading || isTaskLoading;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && handleClose()}>
      <DialogContent className="sm:max-w-120 bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#004a8f]">Edycja zadania</DialogTitle>
        </DialogHeader>

        {isTaskLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#004a8f]" />
            <span className="text-xs">Ładowanie danych zadania...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
            {formError && (
              <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs">
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
                  className="text-red-400 hover:text-red-700 p-0.5 rounded"
                  title="Zamknij"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div>
              <label
                htmlFor="edit-task-title"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Tytuł zadania *
              </label>
              <input
                id="edit-task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="np. Przygotowanie oferty handlowej"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                required
              />
            </div>

            <div>
              <label
                htmlFor="edit-task-description"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Opis zadania *
              </label>
              <textarea
                id="edit-task-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Wprowadź szczegóły zadania..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                required
              />
            </div>

            <div>
              <label
                htmlFor="edit-task-priority"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Priorytet *
              </label>
              <select
                id="edit-task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isDictionariesLoading}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f] bg-white h-9"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-4 border-t mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isFormDisabled}
                className="border-gray-300 text-gray-700"
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isFormDisabled}
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
}
