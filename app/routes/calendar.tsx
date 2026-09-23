import React, { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import { MainLayout } from '~/components/layout/main-layout';
import { format } from 'date-fns';
import { AlertCircle, Filter, Loader2, Plus, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import plLocale from '@fullcalendar/core/locales/pl';
import { type AddTaskRequestPayload, type Task } from '~/interfaces/task';
import { TaskDetailDialog } from '~/components/task/dialogs/task-detail-dialog';
import { AddTaskDialog } from '~/components/task/dialogs/add-task-dialog';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';

export default function CalendarPage() {
  const queryClient = useQueryClient();

  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    data: tasks,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: [
      'calendar-tasks',
      dateRange?.start ? format(dateRange.start, 'yyyy-MM-dd') : null,
      dateRange?.end ? format(dateRange.end, 'yyyy-MM-dd') : null,
      statusFilter,
      priorityFilter,
    ],
    queryFn: async () => {
      if (!dateRange) return [];

      const res = await api.get('/tasks/calendar', {
        params: {
          DateFrom: format(dateRange.start, 'yyyy-MM-dd'),
          DateTo: format(dateRange.end, 'yyyy-MM-dd'),
          TaskStatus: statusFilter || undefined,
          TaskPriority: priorityFilter || undefined,
        },
      });
      return res.data.data as Task[];
    },
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
  });

  const addTaskMutation = useMutation({
    mutationFn: async (payload: AddTaskRequestPayload) => {
      await api.post('/tasks', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      setIsAddModalOpen(false);
    },
  });

  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  const calendarError: FormErrorState | null =
    isError && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message ||
              activeError?.message ||
              'Nie udało się pobrać zadań do kalendarza.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  const { data: dictionaries } = useQuery({
    queryKey: ['task-dictionaries'],
    queryFn: async () => {
      const response = await api.get('/tasks/dictionaries');
      return response.data.data;
    },
    staleTime: Infinity,
  });

  const calendarEvents = (tasks ?? []).map((task) => {
    let bgColor = '#3b82f6';

    if (task.status === 'Complete' || task.status === 'Zakończona') {
      bgColor = '#22c55e';
    } else if (new Date(task.dueAt) < new Date()) {
      bgColor = '#ef4444';
    }

    return {
      id: task.id,
      title: task.title,
      start: task.dueAt,
      backgroundColor: bgColor,
      borderColor: bgColor,
      extendedProps: { ...task },
    };
  });

  if (!isMounted) return null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 flex justify-between items-center">
            <h1 className="text-lg lg:text-2xl font-semibold flex items-center gap-3">
              Mój Kalendarz
              {isFetching && <Loader2 className="animate-spin w-5 h-5 text-blue-200" />}
            </h1>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white text-blue-900 hover:bg-blue-50 font-medium flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj zadanie</span>
            </Button>
          </div>

          <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium shrink-0">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filtruj zadania:</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="calendar-status-filter"
                  className="text-xs text-gray-500 w-16 sm:w-auto"
                >
                  Status:
                </label>
                <select
                  id="calendar-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:ring-blue-900 text-gray-700"
                >
                  <option value="">Wszystkie</option>
                  {dictionaries?.statuses?.map((s: { value: string; label: string }) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="calendar-priority-filter"
                  className="text-xs text-gray-500 w-16 sm:w-auto"
                >
                  Priorytet:
                </label>
                <select
                  id="calendar-priority-filter"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:ring-blue-900 text-gray-700"
                >
                  <option value="">Wszystkie</option>
                  {dictionaries?.priorities?.map((p: { value: string; label: string }) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {calendarError && (
            <div className="mb-4 relative flex items-start gap-2.5 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 pr-4">
                <p className="font-medium leading-tight">{calendarError.title}</p>
                {calendarError.details && calendarError.details.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                    {calendarError.details.map((detailErr, idx) => (
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
          )}

          <div className="bg-white p-3 lg:p-6 rounded-lg border border-gray-200 shadow-sm">
            <div
              className="
              [&_.fc-button-primary]:bg-blue-900!
              [&_.fc-button-primary]:border-blue-900!
              [&_.fc-toolbar.fc-header-toolbar]:max-md:flex-col
              [&_.fc-toolbar.fc-header-toolbar]:max-md:gap-3
              [&_.fc-toolbar-title]:max-md:text-xl!
            "
            >
              <FullCalendar
                key={isMobile ? 'mobile-calendar' : 'desktop-calendar'}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView={isMobile ? 'listMonth' : 'dayGridMonth'}
                locales={[plLocale]}
                locale="pl"
                firstDay={1}
                headerToolbar={{
                  left: isMobile ? 'prev,next' : 'prev,next today',
                  center: 'title',
                  right: isMobile
                    ? 'listMonth,timeGridDay'
                    : 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
                }}
                height={isMobile ? 'auto' : '80vh'}
                dayMaxEvents={3}
                eventDisplay="block"
                datesSet={(dateInfo) => {
                  setDateRange((prev) => {
                    if (
                      prev?.start.getTime() === dateInfo.start.getTime() &&
                      prev?.end.getTime() === dateInfo.end.getTime()
                    ) {
                      return prev;
                    }
                    return { start: dateInfo.start, end: dateInfo.end };
                  });
                }}
                events={calendarEvents}
                eventClick={(info) => {
                  const task = info.event.extendedProps as Task;
                  setSelectedTask(task);
                }}
              />
            </div>
          </div>

          <TaskDetailDialog
            task={selectedTask}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
          />

          <AddTaskDialog
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={async (payload) => {
              await addTaskMutation.mutateAsync(payload);
            }}
            isLoading={addTaskMutation.isPending}
            dialogTitle="Dodaj nowe zadanie"
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
