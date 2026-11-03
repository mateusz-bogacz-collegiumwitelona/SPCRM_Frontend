import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { analyticsApi } from '~/api/analytics.api';
import type { AnalyticsPeriod } from '~/types/analytics';
import type { PdfFilePayload } from '~/types/pdf';

export const analyticsKeys = {
  all: ['analytics'] as const,
  employeeKpi: (userId?: string) => ['employee-kpi', userId] as const,
  employeeChart: (userId?: string, period?: string) => ['employee-chart', userId, period] as const,
  adminMetrics: () => ['admin-system-metrics'] as const,
  teamKpi: () => ['team-kpi-summary'] as const,
  teamChart: (period: AnalyticsPeriod) => ['team-chart', period] as const,
  teamLeaderboard: (page: number, pageSize: number) =>
    ['team-leaderboard', page, pageSize] as const,
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

export function useTeamKpi() {
  return useQuery({
    queryKey: analyticsKeys.teamKpi(),
    queryFn: analyticsApi.getTeamKpi,
  });
}

export function useTeamChart(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: analyticsKeys.teamChart(period),
    queryFn: () => analyticsApi.getTeamChart(period),
  });
}

export function useTeamLeaderboard(page: number, pageSize: number) {
  return useQuery({
    queryKey: analyticsKeys.teamLeaderboard(page, pageSize),
    queryFn: () => analyticsApi.getTeamLeaderboard(page, pageSize),
    placeholderData: keepPreviousData,
  });
}

export function useDownloadAnalyticsReport() {
  return useMutation<PdfFilePayload, unknown, { endpoint: string; period: AnalyticsPeriod }>({
    mutationFn: ({ endpoint, period }) => analyticsApi.downloadPdfReport(endpoint, period),
  });
}
