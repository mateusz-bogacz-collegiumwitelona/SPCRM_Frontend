import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import {
  AlertCircle,
  AlignLeft,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Pencil,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useTaskDictionaries } from '~/hooks/use-task-dictionaries';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { EditTaskDialog, type EditTaskRequestPayload } from '~/components/task/edit-task-dialog';
import { DeleteTaskDialog } from '~/components/task/delete-task-dialog';
import {
  ExtendTaskDueDateDialog,
  type ExtendTaskDueDatePayload,
} from '~/components/task/extend-task-due-date-dialog';
import { ChangeTaskAssigneeDialog } from '~/components/task/change-task-assignee-dialog';
import {
  ChangeTaskStatusDialog,
  type ChangeTaskStatusPayload,
} from '~/components/task/change-task-status-dialog';
import { HasRole } from '~/lib/has-role';
import { Button } from '~/components/ui/button';
import { useNavigate } from 'react-router';

interface TaskCoreDetails {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueAt: string;
  assignedToId?: string;
}

export const TaskInfo = ({ taskId }: { taskId: string }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const {
    data: task,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<TaskCoreDetails>({
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

  const handleEditTask = async (id: string, payload: EditTaskRequestPayload) => {
    setIsEditing(true);
    try {
      await api.put(`/tasks/${id}`, payload);
      await queryClient.invalidateQueries({ queryKey: ['task-core-details', taskId] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      setIsEditOpen(false);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTaskConfirm = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/tasks/${taskId}`);
      await queryClient.invalidateQueries({ queryKey: ['deal-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      setIsDeleteOpen(false);
      navigate('/calendar');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExtendDueDate = async (payload: ExtendTaskDueDatePayload) => {
    setIsExtending(true);
    try {
      await api.put(`/tasks/${taskId}/extend-due-date`, payload);
      await queryClient.invalidateQueries({ queryKey: ['task-core-details', taskId] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      setIsExtendOpen(false);
    } finally {
      setIsExtending(false);
    }
  };

  const handleChangeAssignee = async (newAssigneeId: string) => {
    setIsAssigning(true);
    try {
      await api.put(`/tasks/${taskId}/change-assigned-user/${newAssigneeId}`);
      await queryClient.invalidateQueries({ queryKey: ['task-core-details', taskId] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      setIsAssigneeOpen(false);
      navigate('/calendar');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleChangeStatus = async (payload: ChangeTaskStatusPayload) => {
    setIsChangingStatus(true);
    try {
      await api.put('/tasks/change-status', payload);
      await queryClient.invalidateQueries({ queryKey: ['task-core-details', taskId] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      setIsStatusOpen(false);
    } finally {
      setIsChangingStatus(false);
    }
  };

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
  const isTerminated = task.status === 'Complete' || task.status === 'Break';
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

          {!isTerminated && (
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStatusOpen(true)}
                className="text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-1.5 text-sm"
              >
                <CheckSquare className="w-4 h-4 text-[#004a8f]" />
                Zmień status
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(true)}
                className="text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-1.5 text-sm"
              >
                <Pencil className="w-4 h-4 text-[#004a8f]" />
                Edytuj
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExtendOpen(true)}
                className="text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-1.5 text-sm"
              >
                <Clock className="w-4 h-4 text-[#004a8f]" />
                Przedłuż termin
              </Button>

              <HasRole allowedRoles={['Manager']}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssigneeOpen(true)}
                  className="text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-1.5 text-sm"
                >
                  <UserCheck className="w-4 h-4 text-[#004a8f]" />
                  Zmień pracownika
                </Button>
              </HasRole>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteOpen(true)}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex items-center gap-1.5 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Usuń
              </Button>
            </div>
          )}
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

      <EditTaskDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        taskId={task.id}
        onSave={handleEditTask}
        isLoading={isEditing}
      />

      <DeleteTaskDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteTaskConfirm}
        isLoading={isDeleting}
        taskTitle={task.title}
      />

      <ExtendTaskDueDateDialog
        isOpen={isExtendOpen}
        onClose={() => setIsExtendOpen(false)}
        onConfirm={handleExtendDueDate}
        isLoading={isExtending}
        taskTitle={task.title}
        currentDueAt={task.dueAt}
      />

      <ChangeTaskAssigneeDialog
        isOpen={isAssigneeOpen}
        onClose={() => setIsAssigneeOpen(false)}
        onSave={handleChangeAssignee}
        isLoading={isAssigning}
        taskTitle={task.title}
        currentAssigneeId={task.assignedToId}
      />

      <ChangeTaskStatusDialog
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        onSave={handleChangeStatus}
        isLoading={isChangingStatus}
        taskId={task.id}
        taskTitle={task.title}
        currentStatus={task.status}
      />
    </div>
  );
};
