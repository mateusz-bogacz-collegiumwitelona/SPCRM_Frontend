import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { AlertCircle, AlignLeft, Calendar, CheckCircle2, X } from 'lucide-react';
import { useTaskDictionaries } from '~/hooks/use-task-dictionaries';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export const TaskInfo = ({ taskId }: { taskId: string }) => {
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  const {
    data: task,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ['task-core-details', taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}`);
      return res.data?.data || res.data?.value || res.data;
    },
  });

  const { getStatusLabel, getPriorityLabel } = useTaskDictionaries();

  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  const formError: FormErrorState | null =
    (isError || (!isLoading && !task)) && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message || activeError?.message || 'Nie udało się pobrać danych zadania.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  if (isLoading) {
    return (
      <div className="mb-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  if (formError) {
    return (
      <div className="mb-6 relative flex items-start gap-2.5 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
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
          onClick={() => setIsErrorDismissed(true)}
          className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
          title="Zamknij"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!task) return null;

  const isCompleted = task.status === 'Complete';
  const isOverdue = new Date(task.dueAt) < new Date() && !isCompleted;

  return (
    <div className="mb-6">
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-normal text-[#004a8f] mb-3">{task.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              isCompleted ? 'bg-[#d4edda] text-[#28a745]' : 'bg-blue-100 text-[#004a8f]'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {getStatusLabel(task.status)}
          </span>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wider">
            {getPriorityLabel(task.priority)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-medium ml-2 ${
              isOverdue ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {new Date(task.dueAt).toLocaleString('pl-PL', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {isOverdue && ' (Zaległe)'}
          </span>
        </div>
      </div>

      {task.description && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-6 mb-6">
          <h2 className="text-xl font-normal text-gray-800 mb-4 flex items-center gap-2">
            <AlignLeft className="text-[#004a8f] w-5 h-5" /> Opis zadania
          </h2>
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-100">
            {task.description}
          </div>
        </div>
      )}
    </div>
  );
};
