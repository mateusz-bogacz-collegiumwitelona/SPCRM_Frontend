import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { AddTaskRequestPayload } from '~/interfaces/task';
import { tasksApi } from '~/api/task.api';

export const taskKeys = {
  all: ['tasks'] as const,
  calendar: (from?: string | null, to?: string | null, status?: string, priority?: string) =>
    [...taskKeys.all, 'calendar', from, to, status, priority] as const,
  dictionaries: () => [...taskKeys.all, 'dictionaries'] as const,
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

export function useCreateTask(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddTaskRequestPayload) => tasksApi.createTask(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      options?.onSuccess?.();
    },
  });
}
