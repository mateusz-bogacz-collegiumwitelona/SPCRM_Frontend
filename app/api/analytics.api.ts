import { client } from '~/lib/client';
import type {
  AdminMetricsResponse,
  AnalyticsChartMetricResponse,
  AnalyticsPeriod,
  EmployeeKpiSummaryResponse,
  LeaderboardPagedResponse,
  TeamKpiSummaryResponse,
} from '~/types/analytics';
import type { PdfFilePayload } from '~/types/pdf';

export const analyticsApi = {
  getEmployeeKpi: async (userId: string): Promise<EmployeeKpiSummaryResponse> => {
    const response = await client.get(`/analytics/employees/${userId}/kpi`);
    return response.data;
  },

  getEmployeeChart: async (
    userId: string,
    period: AnalyticsPeriod,
  ): Promise<AnalyticsChartMetricResponse[]> => {
    const response = await client.get(`/analytics/employees/${userId}/chart`, {
      params: { Period: period },
    });
    return response.data ?? [];
  },

  getMyKpi: async (): Promise<EmployeeKpiSummaryResponse> => {
    const response = await client.get('/analytics/me/kpi');
    return response.data;
  },

  getAdminMetrics: async (): Promise<AdminMetricsResponse> => {
    const response = await client.get('/analytics/admin/metrics');
    return response.data;
  },

  getTeamKpi: async (): Promise<TeamKpiSummaryResponse> => {
    const response = await client.get('/analytics/team/kpi');
    return response.data;
  },

  getTeamChart: async (period: AnalyticsPeriod): Promise<AnalyticsChartMetricResponse[]> => {
    const response = await client.get('/analytics/team/chart', {
      params: { Period: period },
    });
    return response.data;
  },

  getTeamLeaderboard: async (page: number, pageSize: number): Promise<LeaderboardPagedResponse> => {
    const response = await client.get('/analytics/team/leaderboard', {
      params: {
        PageNumber: page,
        PageSize: pageSize,
      },
    });
    return response.data;
  },

  downloadPdfReport: async (endpoint: string, period: AnalyticsPeriod): Promise<PdfFilePayload> => {
    const response = await client.get(endpoint, {
      params: { Period: period },
    });
    return response.data;
  },
};
