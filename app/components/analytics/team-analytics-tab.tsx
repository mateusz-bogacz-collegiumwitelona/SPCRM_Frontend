import React, { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import { RevenueChart } from '~/components/analytics/revenue-chart';
import { FileText, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '~/components/ui/button';
import type {
  AnalyticsChartMetricResponse,
  AnalyticsPeriod,
  LeaderboardItemResponse,
  TeamKpiSummaryResponse,
} from '~/types/analytics';
import { LeaderboardTable } from '~/components/analytics/leaderboard-table';
import { DownloadAnalyticsReportDialog } from '~/components/analytics/dialogs/download-analytics-report-dialog';
import { KpiCards } from '~/components/analytics/kpi-cards';
import { QueryErrorBanner } from '~/components/ui/query-error-banner';
import { useCurrenciesSimpleList } from '~/hooks/use-currencies';

export const TeamAnalyticsTab: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('CurrentMonth');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('PLN');
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardPageSize, setLeaderboardPageSize] = useState(5);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const { data: currencies = [] } = useCurrenciesSimpleList();

  useEffect(() => {
    if (currencies && currencies.length > 0) {
      const hasPln = currencies.some((c) => c.code === 'PLN');
      if (!hasPln) setSelectedCurrencyCode(currencies[0].code);
    }
  }, [currencies]);

  const {
    data: kpiData,
    isLoading: isKpiLoading,
    isFetching: isKpiFetching,
    error: kpiQueryError,
    refetch: refetchKpi,
  } = useQuery<TeamKpiSummaryResponse>({
    queryKey: ['team-kpi-summary'],
    queryFn: async () => {
      const response = await client.get('/analytics/team/kpi');
      return response.data?.value || response.data?.data || response.data;
    },
  });

  const {
    data: chartData,
    isLoading: isChartLoading,
    isFetching: isChartFetching,
    refetch: refetchChart,
  } = useQuery<AnalyticsChartMetricResponse[]>({
    queryKey: ['team-chart', selectedPeriod],
    queryFn: async () => {
      const response = await client.get('/analytics/team/chart', {
        params: { Period: selectedPeriod },
      });
      return response.data?.value || response.data?.data || response.data || [];
    },
  });

  const {
    data: leaderboardData,
    isFetching: isLeaderboardFetching,
    refetch: refetchLeaderboard,
  } = useQuery({
    queryKey: ['team-leaderboard', leaderboardPage, leaderboardPageSize],
    queryFn: async () => {
      const response = await client.get('/analytics/team/leaderboard', {
        params: {
          PageNumber: leaderboardPage,
          PageSize: leaderboardPageSize,
        },
      });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const pagedResult = leaderboardData?.data || leaderboardData;
  const leaderboardItems: LeaderboardItemResponse[] = pagedResult?.items || [];
  const leaderboardTotalPages: number = pagedResult?.totalPages || 1;
  const leaderboardTotalCount: number = pagedResult?.totalCount || leaderboardItems.length;

  const handleRefreshAll = () => {
    void Promise.all([refetchKpi(), refetchChart(), refetchLeaderboard()]);
  };

  const isGlobalFetching = isKpiFetching || isChartFetching;

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => setIsPdfModalOpen(true)}
          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-1.5 shadow-xs"
        >
          <FileText className="w-4 h-4 text-blue-900" />
          <span>Raport PDF zespołu</span>
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={handleRefreshAll}
          disabled={isGlobalFetching}
          className="bg-blue-900 text-white hover:bg-blue-800 font-medium flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${isGlobalFetching ? 'animate-spin' : ''}`} />
          <span>Odśwież</span>
        </Button>
      </div>

      <QueryErrorBanner
        error={kpiQueryError}
        fallbackMessage="Nie udało się pobrać danych zamówienia."
        className="mb-6"
      />

      {isKpiLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-blue-900 mb-2" />
          <p className="text-gray-500 text-sm">Pobieranie statystyk zespołu...</p>
        </div>
      ) : (
        <>
          {kpiData && <KpiCards data={kpiData} titlePrefix="zespołu" />}

          <RevenueChart
            data={chartData ?? []}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            currencies={currencies ?? []}
            selectedCurrencyCode={selectedCurrencyCode}
            onCurrencyChange={setSelectedCurrencyCode}
            isLoading={isChartLoading}
          />

          <LeaderboardTable
            items={leaderboardItems}
            pageNumber={leaderboardPage}
            pageSize={leaderboardPageSize}
            totalPages={leaderboardTotalPages}
            totalCount={leaderboardTotalCount}
            isFetching={isLeaderboardFetching}
            onPageChange={setLeaderboardPage}
            onPageSizeChange={(newSize) => {
              setLeaderboardPageSize(newSize);
              setLeaderboardPage(1);
            }}
          />

          <DownloadAnalyticsReportDialog
            isOpen={isPdfModalOpen}
            onClose={() => setIsPdfModalOpen(false)}
            endpoint="/analytics/team/report/pdf"
            title="Raport analityczny zespołu (PDF)"
            defaultPeriod={selectedPeriod}
          />
        </>
      )}
    </div>
  );
};
