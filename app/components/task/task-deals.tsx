import { Briefcase } from 'lucide-react';
import { Link } from 'react-router';
import { formatCurrency } from '~/utils/data-formatters';
import { useTaskDeal } from '~/hooks/use-tasks';
import { QueryErrorBanner } from '~/components/ui/query-error-banner';

export const TaskDeals = ({ taskId }: { taskId: string }) => {
  const { data: deal, isLoading, error: queryError } = useTaskDeal(taskId);

  if (isLoading) return <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>;

  if (!deal) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-6 border-t-4 border-t-brand">
      <h2 className="text-lg font-normal text-gray-800 mb-3 flex items-center gap-2">
        <Briefcase className="text-brand w-5 h-5" /> Transakcja
      </h2>

      <QueryErrorBanner
        error={queryError}
        fallbackMessage="Nie udało się pobrać listy zadań."
        className="mb-6"
      />

      <Link
        to={`/sales/${deal.dealId}`}
        className="text-brand font-medium hover:underline leading-tight block mb-3"
      >
        {deal.name}
      </Link>

      <div className="flex justify-between items-end border-t border-gray-100 pt-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Wartość</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(deal.value, deal.currencyCode, deal.decimalPlaces)}
          </p>
        </div>
        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{deal.status}</span>
      </div>
    </div>
  );
};
