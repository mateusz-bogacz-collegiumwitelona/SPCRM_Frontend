import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '~/api/analytics.api';
import type { AnalyticsPeriod } from '~/types/analytics';

export const analyticsKeys = {
  all: ['analytics'] as const,
  employeeKpi: (userId?: string) => ['employee-kpi', userId] as const,
  employeeChart: (userId?: string, period?: string) => ['employee-chart', userId, period] as const,
  adminMetrics: () => ['admin-system-metrics'] as const,
};
export function useEmployeeKpi(userId?: string) {
  return useQuery({
    queryKey: analyticsKeys.employeeKpi(userId),
    queryFn: () => analyticsApi.getEmployeeKpi(userId || ''),
    enabled: Boolean(userId),
  });
}

export function useEmployeeChart(userId: string, period: AnalyticsPeriod) {
  return useQuery({
    queryKey: analyticsKeys.employeeChart(userId, period),
    queryFn: () => analyticsApi.getEmployeeChart(userId, period),
    enabled: Boolean(userId),
  });
}

export function useMyKpi(userId?: string) {
  return useQuery({
    queryKey: ['my-kpi-summary', userId],
    queryFn: analyticsApi.getMyKpi,
    enabled: Boolean(userId),
  });
}

export function useAdminSystemMetrics() {
  return useQuery({
    queryKey: analyticsKeys.adminMetrics(),
    queryFn: analyticsApi.getAdminMetrics,
  });
}
