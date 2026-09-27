import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import type {
  AddTaskRequestPayload,
  ChangeTaskStatusPayload,
  DealTasksParams,
  EditTaskRequestPayload,
  ExtendTaskDueDatePayload,
} from '~/types/task';
import { tasksApi } from '~/api/task.api';
import { contactsApi } from '~/api/contact.api';
import { dealsApi } from '~/api/deal.api';

export const taskKeys = {
  all: ['tasks'] as const,
  calendar: (from?: string | null, to?: string | null, status?: string, priority?: string) =>
    [...taskKeys.all, 'calendar', from, to, status, priority] as const,
  dictionaries: () => [...taskKeys.all, 'dictionaries'] as const,
  details: (id?: string) => ['task-core-details', id] as const,
  contactTasks: (params: Record<string, unknown>) => ['contact-tasks', params] as const,
  dealTasks: (dealId?: string, params?: Record<string, unknown>) =>
    ['deal-tasks', dealId, params] as const,
  contact: (taskId?: string) => ['task-contact', taskId] as const,
  deal: (taskId?: string) => ['task-deal', taskId] as const,
};

interface UseCalendarTasksProps {
  dateRange: { start: Date; end: Date } | null;
  statusFilter?: string;
  priorityFilter?: string;
}

export function useCalendarTasks({
  dateRange,
  statusFilter,
  priorityFilter,
}: UseCalendarTasksProps) {
  const fromFormatted = dateRange?.start ? format(dateRange.start, 'yyyy-MM-dd') : null;
  const toFormatted = dateRange?.end ? format(dateRange.end, 'yyyy-MM-dd') : null;

  return useQuery({
    queryKey: taskKeys.calendar(fromFormatted, toFormatted, statusFilter, priorityFilter),
    queryFn: () => {
      if (!fromFormatted || !toFormatted) return [];
      return tasksApi.getCalendarTasks({
        dateFrom: fromFormatted,
        dateTo: toFormatted,
        status: statusFilter,
        priority: priorityFilter,
      });
    },
    enabled: Boolean(dateRange),
    placeholderData: keepPreviousData,
  });
}

export function useTaskDictionaries() {
  const { data: dictionaries, isLoading } = useQuery({
    queryKey: taskKeys.dictionaries(),
    queryFn: tasksApi.getDictionaries,
    staleTime: Infinity,
  });

  const getStatusLabel = (statusValue: string) => {
    if (!dictionaries?.statuses) return statusValue;
    const found = dictionaries.statuses.find(
      (s) => s.value.toLowerCase() === statusValue.toLowerCase(),
    );
    return found ? found.label : statusValue;
  };

  const getPriorityLabel = (priorityValue: string) => {
    if (!dictionaries?.priorities) return priorityValue;
    const found = dictionaries.priorities.find(
      (p) => p.value.toLowerCase() === priorityValue.toLowerCase(),
    );
    return found ? found.label : priorityValue;
  };

  return {
    dictionaries,
    statuses: dictionaries?.statuses ?? [],
    priorities: dictionaries?.priorities ?? [],
    isLoading,
    getStatusLabel,
    getPriorityLabel,
  };
}

export function useTaskDetails(taskId?: string | null, enabled = true) {
  return useQuery({
    queryKey: taskKeys.details(taskId || undefined),
    queryFn: () => tasksApi.getDetails(taskId || ''),
    enabled: Boolean(taskId) && enabled,
    retry: false,
  });
}
export function useCreateTask(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddTaskRequestPayload) => tasksApi.createTask(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['my-upcoming-tasks'] });
      options?.onSuccess?.();
    },
  });
}

interface UseContactTasksProps {
  contactId: string;
  pageNumber: number;
  pageSize: number;
  debouncedSearch?: string;
}

export function useContactTasks({
  contactId,
  pageNumber,
  pageSize,
  debouncedSearch,
}: UseContactTasksProps) {
  const queryParams = {
    contactId,
    pageNumber,
    pageSize,
    debouncedSearch: debouncedSearch || undefined,
  };

  return useQuery({
    queryKey: taskKeys.contactTasks(queryParams),
    queryFn: () =>
      contactsApi.getContactTasks(contactId, {
        pageNumber,
        pageSize,
        searchTerm: debouncedSearch,
      }),
    enabled: Boolean(contactId),
    placeholderData: keepPreviousData,
  });
}

export function useContactTaskMutations(contactId: string) {
  const queryClient = useQueryClient();

  const invalidateTasks = async () => {
    await queryClient.invalidateQueries({ queryKey: ['contact-tasks'] });
    await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
    await queryClient.invalidateQueries({ queryKey: taskKeys.all });
  };

  const addTaskMutation = useMutation({
    mutationFn: (payload: AddTaskRequestPayload) => contactsApi.addContactTask(contactId, payload),
    onSuccess: invalidateTasks,
  });

  const editTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: EditTaskRequestPayload }) =>
      tasksApi.editTask(taskId, payload),
    onSuccess: invalidateTasks,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.deleteTask(taskId),
    onSuccess: invalidateTasks,
  });

  return {
    addTaskMutation,
    editTaskMutation,
    deleteTaskMutation,
  };
}

export function useDealTasks(dealId: string, params: DealTasksParams) {
  return useQuery({
    queryKey: taskKeys.dealTasks(dealId, params as unknown as Record<string, unknown>),
    queryFn: () => dealsApi.getDealTasks(dealId, params),
    placeholderData: keepPreviousData,
    enabled: Boolean(dealId),
  });
}

export function useDealTaskMutations(dealId: string) {
  const queryClient = useQueryClient();

  const invalidateTasks = async () => {
    await queryClient.invalidateQueries({ queryKey: ['deal-tasks', dealId] });
    await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
    await queryClient.invalidateQueries({ queryKey: taskKeys.all });
  };

  const addDealTaskMutation = useMutation({
    mutationFn: (payload: AddTaskRequestPayload) => dealsApi.addDealTask(dealId, payload),
    onSuccess: invalidateTasks,
  });

  const editDealTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: EditTaskRequestPayload }) =>
      tasksApi.editTask(taskId, payload),
    onSuccess: invalidateTasks,
  });

  const deleteDealTaskMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.deleteTask(taskId),
    onSuccess: invalidateTasks,
  });

  return {
    addDealTaskMutation,
    editDealTaskMutation,
    deleteDealTaskMutation,
  };
}

export function useChangeTaskStatusMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      tasksApi.changeStatus({ taskId, status }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      await queryClient.invalidateQueries({ queryKey: taskKeys.details(variables.taskId) });
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      options?.onSuccess?.();
    },
  });
}

export function useTaskContact(taskId?: string) {
  return useQuery({
    queryKey: taskKeys.contact(taskId),
    queryFn: () => tasksApi.getContact(taskId || ''),
    enabled: Boolean(taskId),
    retry: false,
  });
}

export function useTaskDeal(taskId?: string) {
  return useQuery({
    queryKey: taskKeys.deal(taskId),
    queryFn: () => tasksApi.getDeal(taskId || ''),
    enabled: Boolean(taskId),
    retry: false,
  });
}

export function useTaskInfoMutations(taskId: string) {
  const queryClient = useQueryClient();

  const invalidateTask = async () => {
    await queryClient.invalidateQueries({ queryKey: taskKeys.details(taskId) });
    await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
    await queryClient.invalidateQueries({ queryKey: taskKeys.all });
  };

  const editTaskMutation = useMutation({
    mutationFn: (payload: EditTaskRequestPayload) => tasksApi.editTask(taskId, payload),
    onSuccess: invalidateTask,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => tasksApi.deleteTask(taskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['deal-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  const extendDueDateMutation = useMutation({
    mutationFn: (payload: ExtendTaskDueDatePayload) => tasksApi.extendDueDate(taskId, payload),
    onSuccess: invalidateTask,
  });

  const changeAssigneeMutation = useMutation({
    mutationFn: (newAssigneeId: string) => tasksApi.changeAssignee(taskId, newAssigneeId),
    onSuccess: invalidateTask,
  });

  const changeStatusMutation = useMutation({
    mutationFn: (payload: ChangeTaskStatusPayload) => tasksApi.changeStatus(payload),
    onSuccess: invalidateTask,
  });

  return {
    editTaskMutation,
    deleteTaskMutation,
    extendDueDateMutation,
    changeAssigneeMutation,
    changeStatusMutation,
  };
}

export function useUpcomingTasks(limit = 5) {
  const today = new Date();
  const nextWeek = addDays(today, 7);

  return useQuery({
    queryKey: ['my-upcoming-tasks'],
    queryFn: async () => {
      const list = await tasksApi.getCalendarTasks({
        dateFrom: format(today, 'yyyy-MM-dd'),
        dateTo: format(nextWeek, 'yyyy-MM-dd'),
      });
      return list
        .filter((t) => t.status !== 'Complete' && t.status !== 'Zakończona')
        .slice(0, limit);
    },
  });
}
