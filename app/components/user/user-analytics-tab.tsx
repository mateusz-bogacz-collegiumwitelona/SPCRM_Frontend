import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import {
  type AnalyticsChartMetricResponse,
  type AnalyticsPeriod,
  type CurrencyListResponse,
  TeamRevenueChart,
} from '~/components/analytics/team-revenue-chart';

export const UserAnalyticsTab = ({ userId }: { userId: string }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('CurrentMonth');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('PLN');

  const { data: currencies } = useQuery<CurrencyListResponse[]>({
    queryKey: ['currencies-simple'],
    queryFn: async () => {
      const response = await api.get('/currency/simple');
      return response.data?.value || response.data?.data || response.data || [];
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (currencies && currencies.length > 0) {
      const hasPln = currencies.some((c) => c.code === 'PLN');
      if (!hasPln) setSelectedCurrencyCode(currencies[0].code);
    }
  }, [currencies]);

  const { data: chartData, isLoading: isChartLoading } = useQuery<AnalyticsChartMetricResponse[]>({
    queryKey: ['employee-chart', userId, selectedPeriod],
    queryFn: async () => {
      const response = await api.get(`/analytics/employees/${userId}/chart`, {
        params: { Period: selectedPeriod },
      });
      return response.data?.value || response.data?.data || response.data || [];
    },
    enabled: Boolean(userId),
  });

  return (
    <div className="space-y-6">
      <TeamRevenueChart
        data={chartData || []}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        currencies={currencies || []}
        selectedCurrencyCode={selectedCurrencyCode}
        onCurrencyChange={setSelectedCurrencyCode}
        isLoading={isChartLoading}
      />
    </div>
  );
};
