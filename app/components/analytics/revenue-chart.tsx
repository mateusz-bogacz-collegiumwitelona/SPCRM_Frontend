import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '~/utils/data-formatters';
import type { CurrencyAmountResponse } from '~/interfaces/analytics';

export type AnalyticsPeriod = 'CurrentMonth' | 'HalfYear' | 'CurrentYear';

export interface CurrencyListResponse {
  currencyId: string;
  name: string;
  code: string;
  decimalPlace: number;
}

export interface AnalyticsChartMetricResponse {
  label: string;
  revenue: CurrencyAmountResponse[];
  dealsWonCount: number;
}

interface TeamRevenueChartProps {
  data: AnalyticsChartMetricResponse[];
  selectedPeriod: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  currencies: CurrencyListResponse[];
  selectedCurrencyCode: string;
  onCurrencyChange: (code: string) => void;
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      label: string;
      amount: number;
      dealsWonCount: number;
    };
  }>;
  label?: string;
  selectedCurrency: string;
  decimalPlaces: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  selectedCurrency,
  decimalPlaces,
}) => {
  if (active && payload && payload.length > 0) {
    const revenueAmount = payload[0]?.payload?.amount ?? 0;
    const dealsWon = payload[0]?.payload?.dealsWonCount ?? 0;

    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-lg text-xs space-y-1.5 min-w-35">
        <p className="font-semibold text-gray-800 border-b border-gray-100 pb-1">{label}</p>

        <div className="text-blue-900 font-medium flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-700" />
            <span>Przychód:</span>
          </span>
          <span className="font-bold">
            {formatCurrency(revenueAmount, selectedCurrency, decimalPlaces)}
          </span>
        </div>

        <div className="text-emerald-700 font-medium flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Wygrane:</span>
          </span>
          <span className="font-bold">{dealsWon} szt.</span>
        </div>
      </div>
    );
  }
  return null;
};

export const RevenueChart: React.FC<TeamRevenueChartProps> = ({
  data,
  selectedPeriod,
  onPeriodChange,
  currencies,
  selectedCurrencyCode,
  onCurrencyChange,
  isLoading,
}) => {
  const currentCurrency = useMemo(() => {
    return (
      currencies.find((c) => c.code === selectedCurrencyCode) || {
        code: selectedCurrencyCode,
        decimalPlace: 2,
        name: selectedCurrencyCode,
      }
    );
  }, [currencies, selectedCurrencyCode]);

  const chartData = useMemo(() => {
    return data.map((item) => {
      const match = item.revenue?.find((r) => r.currencyCode === selectedCurrencyCode);
      return {
        label: item.label,
        amount: match ? (match.amount ?? 0) : 0,
        dealsWonCount: item.dealsWonCount,
      };
    });
  }, [data, selectedCurrencyCode]);

  const renderChartContent = () => {
    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <span className="text-gray-400 text-xs animate-pulse">Ładowanie wykresu...</span>
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <span className="text-gray-400 text-xs">Brak danych dla wybranego okresu.</span>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="teamRevenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
            </linearGradient>

            <linearGradient id="teamDealsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tick={{ fill: '#64748b', fontSize: 11 }}
          />

          <YAxis
            yAxisId="rev"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(val) => {
              const num = val / 10000;
              return num >= 1000 ? `${(num / 1000).toFixed(0)}k` : `${num}`;
            }}
          />

          <YAxis
            yAxisId="deals"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#10b981', fontSize: 11 }}
            allowDecimals={false}
          />

          <Tooltip
            content={
              <CustomTooltip
                selectedCurrency={selectedCurrencyCode}
                decimalPlaces={currentCurrency.decimalPlace}
              />
            }
          />

          <Area
            yAxisId="deals"
            type="monotone"
            dataKey="dealsWonCount"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#teamDealsGrad)"
          />

          <Area
            yAxisId="rev"
            type="monotone"
            dataKey="amount"
            stroke="#1e3a8a"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#teamRevenueGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Dynamika sprzedaży</h3>
          <p className="text-xs text-gray-500">Przychód oraz liczba wygranych transakcji</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currencies && currencies.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label htmlFor="currency-select" className="text-xs text-gray-500">
                Waluta:
              </label>
              <select
                id="currency-select"
                value={selectedCurrencyCode}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="border border-gray-300 rounded-md px-2.5 py-1 text-xs bg-white text-gray-800 font-medium focus:ring-1 focus:ring-blue-900 focus:outline-none"
              >
                {currencies.map((curr) => (
                  <option key={curr.currencyId} value={curr.code}>
                    {curr.code} ({curr.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => onPeriodChange('CurrentMonth')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedPeriod === 'CurrentMonth'
                  ? 'bg-white text-blue-900 font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Miesiąc
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange('HalfYear')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedPeriod === 'HalfYear'
                  ? 'bg-white text-blue-900 font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pół roku
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange('CurrentYear')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedPeriod === 'CurrentYear'
                  ? 'bg-white text-blue-900 font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bieżący rok
            </button>
          </div>
        </div>
      </div>

      <div className="h-80 w-full pt-4">{renderChartContent()}</div>

      <div className="flex items-center justify-center gap-6 pt-2 border-t border-gray-100 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-900 inline-block" />
          <span>Przychód ({selectedCurrencyCode})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          <span>Wygrane transakcje</span>
        </div>
      </div>
    </div>
  );
};
