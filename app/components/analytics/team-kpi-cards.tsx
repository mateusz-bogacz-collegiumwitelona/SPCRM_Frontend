import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '~/utils/data-formatters';

export interface CurrencyAmountResponse {
  currencyCode: string;
  decimalPlaces: number;
  amount: number;
}

export interface TeamKpiSummaryResponse {
  revenueThisWeek: CurrencyAmountResponse[];
  revenueThisMonth: CurrencyAmountResponse[];
  revenueThisYear: CurrencyAmountResponse[];

  activeDealsCount: number;
  wonDealsThisMonth: number;
  lostDealsThisMonth: number;

  completedTasksThisMonth: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
}

interface TeamKpiCardsProps {
  data: TeamKpiSummaryResponse;
}

const RevenueList = ({ amounts }: { amounts: CurrencyAmountResponse[] }) => {
  if (!amounts || amounts.length === 0) {
    return <span className="text-xl font-bold text-gray-900">{formatCurrency(0)}</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {amounts.map((amount) => (
        <span key={amount.currencyCode} className="text-xl font-bold text-gray-900">
          {formatCurrency(amount.amount, amount.currencyCode, amount.decimalPlaces)}
        </span>
      ))}
    </div>
  );
};

export const TeamKpiCards: React.FC<TeamKpiCardsProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Przychody zespołu
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Przychód (Ten tydzień)</p>
              <div className="mt-1">
                <RevenueList amounts={data.revenueThisWeek} />
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-900 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Przychód (Ten miesiąc)</p>
              <div className="mt-1">
                <RevenueList amounts={data.revenueThisMonth} />
              </div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Przychód (Bieżący rok)</p>
              <div className="mt-1">
                <RevenueList amounts={data.revenueThisYear} />
              </div>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Szanse sprzedaży (Deals)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Aktywne transakcje</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.activeDealsCount}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Wygrane w tym miesiącu</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{data.wonDealsThisMonth}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Przegrane w tym miesiącu</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{data.lostDealsThisMonth}</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Zadania zespołu
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Ukończone w tym miesiącu</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.completedTasksThisMonth}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Zadania oczekujące</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{data.pendingTasksCount}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Zadania przeterminowane</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{data.overdueTasksCount}</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
