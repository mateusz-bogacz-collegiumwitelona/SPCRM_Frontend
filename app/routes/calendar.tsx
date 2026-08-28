import React, { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { MainLayout } from '~/components/layout/main-layout';
import { format } from 'date-fns';
import { AlertCircle, Filter, Loader2 } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/api-error';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import plLocale from '@fullcalendar/core/locales/pl';

import { type TaskCalendarResponse } from '~/interfaces/task-calendar-response';
import { TaskDialog } from '~/components/calendar/task-dialog';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';

export default function CalendarPage() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskCalendarResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

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
      return res.data.data as TaskCalendarResponse[];
    },
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
  });

  const errorMessage = isError
    ? getErrorMessage(
        (queryError as ApiError)?.response?.data?.errorCode,
        'Nie udało się pobrać zadań do kalendarza.',
      )
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
                  htmlFor="calendat-piority-filter"
                  className="text-xs text-gray-500 w-16 sm:w-auto"
                >
                  Priorytet:
                </label>
                <select
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

          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          <div className="bg-white p-3 lg:p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="calendar-container">
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
                  const task = info.event.extendedProps as TaskCalendarResponse;
                  setSelectedTask(task);
                }}
              />
            </div>
          </div>

          <TaskDialog
            task={selectedTask}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
          />

          <style>{`
          .calendar-container .fc-button-primary {
            background-color: #1e3a8a !important; 
            border-color: #1e3a8a !important;
          }
          .calendar-container .fc-button-primary:hover {
            background-color: #1e40af !important; 
          }
          .calendar-container .fc-button-active {
            background-color: #172554 !important; 
          }
          
          @media (max-width: 768px) {
            .fc .fc-toolbar.fc-header-toolbar {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .fc .fc-toolbar-title {
              font-size: 1.25rem !important;
            }
          }
        `}</style>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
