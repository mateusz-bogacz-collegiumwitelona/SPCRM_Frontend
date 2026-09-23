import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';

import { FileText, Loader2, TrendingUp } from 'lucide-react';
import {
  type AnalyticsChartMetricResponse,
  type AnalyticsPeriod,
  type CurrencyListResponse,
  RevenueChart,
} from '~/components/analytics/revenue-chart';
import type { EmployeeKpiSummaryResponse } from '~/interfaces/analytics';
import { KpiCards } from '~/components/analytics/kpi-cards';
import { Button } from '~/components/ui/button';
import { DownloadAnalyticsReportDialog } from '~/components/analytics/dialogs/download-analytics-report-dialog';

export const UserAnalyticsTab = ({ userId }: { userId: string }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('CurrentMonth');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('PLN');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

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

  const { data: kpiData, isLoading: isKpiLoading } = useQuery<EmployeeKpiSummaryResponse>({
    queryKey: ['employee-kpi', userId],
    queryFn: async () => {
      const response = await api.get(`/analytics/employees/${userId}/kpi`);
      return response.data?.value || response.data?.data || response.data;
    },
    enabled: Boolean(userId),
  });

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

  if (isKpiLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900 mb-2" />
        <p className="text-gray-500 text-sm">Wczytywanie statystyk pracownika...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Wyniki i analityka pracownika</h2>
            <p className="text-xs text-gray-500">
              Podsumowanie efektywności sprzedaży, transakcji oraz zadań
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsPdfModalOpen(true)}
          className="bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          <span>Pobierz raport PDF</span>
        </Button>
      </div>

      {kpiData && <KpiCards data={kpiData} titlePrefix="pracownika" />}

      <RevenueChart
        data={chartData || []}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        currencies={currencies || []}
        selectedCurrencyCode={selectedCurrencyCode}
        onCurrencyChange={setSelectedCurrencyCode}
        isLoading={isChartLoading}
      />

      <DownloadAnalyticsReportDialog
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        endpoint={`/analytics/employees/${userId}/report/pdf`}
        title="Raport analityczny pracownika (PDF)"
        defaultPeriod={selectedPeriod}
      />
    </div>
  );
};
