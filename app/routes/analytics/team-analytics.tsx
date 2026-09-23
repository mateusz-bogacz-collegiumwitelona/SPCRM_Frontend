import React, { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { MainLayout } from '~/components/layout/main-layout';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import {
  type AnalyticsChartMetricResponse,
  type AnalyticsPeriod,
  type CurrencyListResponse,
  RevenueChart,
} from '~/components/analytics/revenue-chart';
import { AlertCircle, BarChart3, FileText, Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { getErrorMessage } from '~/utils/error-mapper';
import type { LeaderboardItemResponse, TeamKpiSummaryResponse } from '~/interfaces/analytics';
import { LeaderboardTable } from '~/components/analytics/leaderboard-table';
import { DownloadAnalyticsReportDialog } from '~/components/analytics/download-analytics-report-dialog';
import { KpiCards } from '~/components/analytics/kpi-cards';

export default function TeamAnalyticsPage() {
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('CurrentMonth');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('PLN');
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardPageSize, setLeaderboardPageSize] = useState(5);
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
      if (!hasPln) {
        setSelectedCurrencyCode(currencies[0].code);
      }
    }
  }, [currencies]);

  const {
    data: kpiData,
    isLoading: isKpiLoading,
    isFetching: isKpiFetching,
    isError: isKpiError,
    error: kpiQueryError,
    refetch: refetchKpi,
  } = useQuery<TeamKpiSummaryResponse>({
    queryKey: ['team-kpi-summary'],
    queryFn: async () => {
      const response = await api.get('/analytics/team/kpi');
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
      const response = await api.get('/analytics/team/chart', {
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
      const response = await api.get('/analytics/team/leaderboard', {
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
    refetchKpi();
    refetchChart();
    refetchLeaderboard();
  };

  const isGlobalFetching = isKpiFetching || isChartFetching;

  const activeError = kpiQueryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isKpiError) {
      setIsErrorDismissed(false);
    }
  }, [isKpiError, kpiQueryError]);

  const kpiError: FormErrorState | null =
    isKpiError && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message ||
              activeError?.message ||
              'Nie udało się pobrać statystyk KPI zespołu.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['Manager']}>
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-200" />
              <h1 className="text-lg lg:text-2xl font-semibold flex items-center gap-3">
                Statystyki zespołu
                {isGlobalFetching && <Loader2 className="animate-spin w-5 h-5 text-blue-200" />}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsPdfModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5 shadow-xs border border-white/20"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Raport PDF</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleRefreshAll}
                disabled={isGlobalFetching}
                className="bg-white text-blue-900 hover:bg-blue-50 font-medium flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isGlobalFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Odśwież</span>
              </Button>
            </div>
          </div>

          {kpiError && (
            <div className="mb-6 relative flex items-start gap-2.5 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 pr-4">
                <p className="font-medium leading-tight">{kpiError.title}</p>
                {kpiError.details && kpiError.details.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                    {kpiError.details.map((detailErr, idx) => (
                      <li key={idx}>{detailErr}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsErrorDismissed(true)}
                className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                title="Zamknij"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isKpiLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-blue-900 mb-2" />
              <p className="text-gray-500 text-sm">Pobieranie statystyk zespołu...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {kpiData && <KpiCards data={kpiData} />}

              <RevenueChart
                data={chartData || []}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                currencies={currencies || []}
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
            </div>
          )}
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
