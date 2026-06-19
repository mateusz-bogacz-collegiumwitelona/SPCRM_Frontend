import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '~/api/api';
import { AuthGuard } from '~/lib/auth-guard';
import { MainLayout } from '~/components/main-layout';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import plLocale from '@fullcalendar/core/locales/pl';

import { type TaskCalendarResponse } from '~/interfaces/task-calendar-response';
import { TaskDialog } from '~/components/calendar/task-dialog';

export default function CalendarPage() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskCalendarResponse | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: tasks, isFetching } = useQuery({
    queryKey: [
      'calendar-tasks',
      dateRange ? format(dateRange.start, 'yyyy-MM-dd') : null,
      dateRange ? format(dateRange.end, 'yyyy-MM-dd') : null,
    ],
    queryFn: async () => {
      if (!dateRange) return [];

      const res = await api.get('/tasks/calendar', {
        params: {
          DateFrom: format(dateRange.start, 'yyyy-MM-dd'),
          DateTo: format(dateRange.end, 'yyyy-MM-dd'),
        },
      });
      return res.data.data as TaskCalendarResponse[];
    },
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
  });

  const calendarEvents = (tasks || []).map((task) => {
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
    <AuthGuard allowedRoles={['User', 'Manager']}>
      <MainLayout>
        {/* Pasek nagłówka */}
        <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6 flex justify-between items-center">
          <h1 className="text-lg lg:text-2xl font-semibold flex items-center gap-3">
            Mój Kalendarz
            {isFetching && <Loader2 className="animate-spin w-5 h-5 text-blue-200" />}
          </h1>
        </div>

        {/* Główny kontener kalendarza */}
        <div className="bg-white p-3 lg:p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="calendar-container">
            <FullCalendar
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
                    prev &&
                    prev.start.getTime() === dateInfo.start.getTime() &&
                    prev.end.getTime() === dateInfo.end.getTime()
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
    </AuthGuard>
  );
}
