import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { useAuth } from '~/context/auth-context';
import { KpiCards } from '~/components/analytics/kpi-cards';
import type { EmployeeKpiSummaryResponse } from '~/interfaces/analytics';
import type { Task } from '~/interfaces/task';
import { TaskDetailDialog } from '~/components/task/dialogs/task-detail-dialog';
import { getStatusConfig } from '~/utils/sale-status';
import { formatCurrency } from '~/utils/data-formatters';
import { addDays, format } from 'date-fns';
import { Link } from 'react-router';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar as CalendarIcon,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface UserSalesResponse {
  id: string;
  name: string;
  nip: string;
  status: string;
  closeDate: string;
  value: number;
  decimalPlace: number;
  currency: string;
  companyName: string;
}

export const UserDashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: kpiData, isLoading: isKpiLoading } = useQuery<EmployeeKpiSummaryResponse>({
    queryKey: ['my-kpi-summary', user?.userId],
    queryFn: async () => {
      const res = await api.get('/analytics/me/kpi');
      return res.data?.value || res.data?.data || res.data;
    },
    enabled: !!user?.userId,
  });

  const today = new Date();
  const nextWeek = addDays(today, 7);

  const { data: upcomingTasks, isLoading: isTasksLoading } = useQuery<Task[]>({
    queryKey: ['my-upcoming-tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks/calendar', {
        params: {
          DateFrom: format(today, 'yyyy-MM-dd'),
          DateTo: format(nextWeek, 'yyyy-MM-dd'),
        },
      });
      const list = res.data?.value || res.data?.data || res.data || [];
      return list
        .filter((t: Task) => t.status !== 'Complete' && t.status !== 'Zakończona')
        .slice(0, 5);
    },
  });

  const { data: recentSales, isLoading: isSalesLoading } = useQuery<UserSalesResponse[]>({
    queryKey: ['my-recent-sales'],
    queryFn: async () => {
      const res = await api.get('/sales', {
        params: {
          PageNumber: 1,
          PageSize: 5,
          SortBy: 'date',
          SortDescending: true,
        },
      });
      const payload = res.data?.value || res.data?.data || res.data;
      return payload?.items || [];
    },
  });

  return (
    <div className="space-y-6">
      {isKpiLoading ? (
        <div className="flex items-center justify-center p-8 bg-white rounded-lg border border-gray-200">
          <Loader2 className="w-6 h-6 animate-spin text-blue-900 mr-2" />
          <span className="text-sm text-gray-500">Wczytywanie statystyk...</span>
        </div>
      ) : (
        kpiData && <KpiCards data={kpiData} titlePrefix="moje" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col juFstify-between">
          <div>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-900" />
                <h2 className="text-base font-semibold text-gray-900">Moje najbliższe zadania</h2>
              </div>
              <Link
                to="/calendar"
                className="text-xs font-medium text-blue-900 hover:text-blue-700 flex items-center gap-1"
              >
                Kalendarz <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4">
              {isTasksLoading ? (
                <div className="py-8 flex justify-center items-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-900" />
                </div>
              ) : !upcomingTasks || upcomingTasks.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm flex flex-col items-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <p>Brak oczekujących zadań na najbliższe dni.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingTasks.map((task) => {
                    const isOverdue = new Date(task.dueAt) < new Date();
                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between gap-3"
                      >
                        <div className="truncate">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs font-medium flex items-center gap-1 ${
                                isOverdue ? 'text-red-600' : 'text-gray-500'
                              }`}
                            >
                              {isOverdue && <AlertCircle className="w-3 h-3" />}
                              Termin: {format(new Date(task.dueAt), 'dd.MM.yyyy HH:mm')}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                            isOverdue
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {task.priority || task.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-900" />
                <h2 className="text-base font-semibold text-gray-900">Moje szanse sprzedaży</h2>
              </div>
              <Link
                to="/sales"
                className="text-xs font-medium text-blue-900 hover:text-blue-700 flex items-center gap-1"
              >
                Wszystkie szanse <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4">
              {isSalesLoading ? (
                <div className="py-8 flex justify-center items-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-900" />
                </div>
              ) : !recentSales || recentSales.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  Brak zarejestrowanych szans sprzedaży.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentSales.map((sale) => {
                    const status = getStatusConfig(sale.status);
                    return (
                      <div
                        key={sale.id}
                        className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="truncate">
                          <Link
                            to={`/sale/${sale.id}`}
                            className="text-sm font-semibold text-blue-900 hover:underline truncate block"
                          >
                            {sale.name}
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {sale.companyName}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(sale.value, sale.currency, sale.decimalPlace)}
                          </p>
                          <span
                            className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${status.bgColor} ${status.textColor}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskDetailDialog
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
};
