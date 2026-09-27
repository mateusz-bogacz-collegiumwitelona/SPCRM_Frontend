import { client } from '~/lib/client';
import type {
  AdminMetricsResponse,
  AnalyticsChartMetricResponse,
  AnalyticsPeriod,
  EmployeeKpiSummaryResponse,
} from '~/types/analytics';

export const analyticsApi = {
  getEmployeeKpi: async (userId: string): Promise<EmployeeKpiSummaryResponse> => {
    const response = await client.get(`/analytics/employees/${userId}/kpi`);
    return response.data?.value || response.data?.data || response.data;
  },

  getEmployeeChart: async (
    userId: string,
    period: AnalyticsPeriod,
  ): Promise<AnalyticsChartMetricResponse[]> => {
    const response = await client.get(`/analytics/employees/${userId}/chart`, {
      params: { Period: period },
    });
    return response.data?.value || response.data?.data || response.data || [];
  },

  getMyKpi: async (): Promise<EmployeeKpiSummaryResponse> => {
    const response = await client.get('/analytics/me/kpi');
    return response.data?.value || response.data?.data || response.data;
  },

  getAdminMetrics: async (): Promise<AdminMetricsResponse> => {
    const response = await client.get('/analytics/admin/metrics');
    return response.data?.value || response.data?.data || response.data;
  },
};
