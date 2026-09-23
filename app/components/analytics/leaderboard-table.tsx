import React from 'react';
import { Briefcase, CheckCircle2, ChevronLeft, ChevronRight, Medal, Trophy } from 'lucide-react';
import { formatCurrency } from '~/utils/data-formatters';
import type { CurrencyAmountResponse, LeaderboardItemResponse } from '~/interfaces/analytics';
import { Button } from '~/components/ui/button';

interface TeamLeaderboardTableProps {
  items?: LeaderboardItemResponse[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  isFetching: boolean;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
}

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return (
      <div
        className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-600 font-bold text-xs shadow-xs"
        title="1. Miejsce"
      >
        <Trophy className="w-4 h-4 text-amber-500" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div
        className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs shadow-xs"
        title="2. Miejsce"
      >
        <Medal className="w-4 h-4 text-slate-400" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div
        className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/10 text-amber-800 font-bold text-xs shadow-xs"
        title="3. Miejsce"
      >
        <Medal className="w-4 h-4 text-amber-700" />
      </div>
    );
  }
  return (
    <span className="flex items-center justify-center w-7 h-7 text-xs font-semibold text-gray-500">
      #{rank}
    </span>
  );
};

const RevenueCell = ({ amounts }: { amounts?: CurrencyAmountResponse[] }) => {
  if (!amounts || amounts.length === 0) {
    return <span className="font-semibold text-gray-900">{formatCurrency(0)}</span>;
  }
  return (
    <div className="flex flex-col">
      {amounts.map((a) => (
        <span key={a.currencyCode} className="font-bold text-blue-900 text-sm">
          {formatCurrency(a.amount ?? 0, a.currencyCode, a.decimalPlaces ?? 2)}
        </span>
      ))}
    </div>
  );
};

export const LeaderboardTable: React.FC<TeamLeaderboardTableProps> = ({
  items = [],
  pageNumber,
  pageSize,
  totalPages,
  totalCount,
  isFetching,
  onPageChange,
  onPageSizeChange,
}) => {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-semibold text-gray-900">
            Ranking Handlowców (Ten miesiąc)
          </h2>
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
            {totalCount ?? safeItems.length}
          </span>
        </div>
      </div>

      <div className="block lg:hidden divide-y divide-gray-100 p-4 space-y-3">
        {safeItems.length === 0 ? (
          <p className="text-center py-6 text-gray-500 text-sm">Brak danych w rankingu.</p>
        ) : (
          safeItems.map((item, index) => {
            const rank = (pageNumber - 1) * pageSize + index + 1;
            const winRate = Number(item?.winRatePercentageThisMonth ?? 0);

            return (
              <div
                key={item?.employeeId || index}
                className="bg-gray-50/50 p-4 rounded-lg border border-gray-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <RankBadge rank={rank} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {item?.firstName ?? ''} {item?.lastName ?? ''}
                      </p>
                      <p className="text-xs text-gray-500">{item?.email ?? ''}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs">
                  <div>
                    <span className="text-gray-500 block">Przychód:</span>
                    <RevenueCell amounts={item?.revenueThisMonth} />
                  </div>
                  <div>
                    <span className="text-gray-500 block">Skuteczność (Win Rate):</span>
                    <span className="font-semibold text-emerald-600 text-sm">
                      {winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Wygrane szanse:</span>
                    <span className="font-medium text-gray-900">
                      {item?.wonDealsThisMonth ?? 0} szt.
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Aktywne transakcje:</span>
                    <span className="font-medium text-gray-900">
                      {item?.activeDealsCount ?? 0} szt.
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4 w-16 text-center">Poz.</th>
              <th className="py-3.5 px-4">Pracownik</th>
              <th className="py-3.5 px-4">Przychód (Miesiąc)</th>
              <th className="py-3.5 px-4 text-center">Wygrane transakcje</th>
              <th className="py-3.5 px-4 text-center">Aktywne szanse</th>
              <th className="py-3.5 px-4 text-center">Skuteczność (Win Rate)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {safeItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Brak danych w rankingu.
                </td>
              </tr>
            ) : (
              safeItems.map((item, index) => {
                const rank = (pageNumber - 1) * pageSize + index + 1;
                const winRate = Number(item?.winRatePercentageThisMonth ?? 0);

                return (
                  <tr
                    key={item?.employeeId || index}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">
                        <RankBadge rank={rank} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {item?.firstName ?? ''} {item?.lastName ?? ''}
                        </span>
                        <span className="text-xs text-gray-400">{item?.email ?? ''}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <RevenueCell amounts={item?.revenueThisMonth} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-medium text-gray-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {item?.wonDealsThisMonth ?? 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        {item?.activeDealsCount ?? 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          winRate >= 50
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : winRate >= 25
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {winRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 bg-white rounded-b-lg border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Pozycji:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-900"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        <div className="text-xs text-gray-500 hidden sm:block">
          Wyświetlanie {Math.min((pageNumber - 1) * pageSize + 1, totalCount || safeItems.length)}{' '}
          do {Math.min(pageNumber * pageSize, totalCount || safeItems.length)} z{' '}
          {totalCount || safeItems.length} handlowców
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            onClick={() => onPageChange(Math.max(pageNumber - 1, 1))}
            disabled={pageNumber === 1 || isFetching}
            variant="outline"
            size="icon"
            className="h-8 w-8 text-blue-900 border-gray-300 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium text-gray-700 px-2">
            Strona {pageNumber} z {Math.max(totalPages, 1)}
          </span>
          <Button
            type="button"
            onClick={() => onPageChange(Math.min(pageNumber + 1, Math.max(totalPages, 1)))}
            disabled={pageNumber >= totalPages || isFetching}
            variant="outline"
            size="icon"
            className="h-8 w-8 text-blue-900 border-gray-300 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
