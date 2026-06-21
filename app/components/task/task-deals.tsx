import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { Briefcase } from 'lucide-react';
import { Link } from 'react-router';
import { formatCurrency } from '~/utils/currency-formatter';

interface TaskDealResponse {
  dealId: string;
  name: string;
  value: number;
  status: string;
  colseDate: string;
  currencyCode: string;
  decimalPlaces: number;
}

export const TaskDeals = ({ taskId }: { taskId: string }) => {
  const { data: deal, isLoading } = useQuery<TaskDealResponse>({
    queryKey: ['task-deal', taskId],
    queryFn: async () => {
      try {
        const response = await api.get(`/tasks/${taskId}/deal`);
        return response.data.data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  if (isLoading) return <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>;
  if (!deal) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-6 border-t-4 border-t-[#004a8f]">
      <h2 className="text-lg font-normal text-gray-800 mb-3 flex items-center gap-2">
        <Briefcase className="text-[#004a8f] w-5 h-5" /> Transakcja
      </h2>

      <Link
        to={`/deals/${deal.dealId}`}
        className="text-[#004a8f] font-medium hover:underline leading-tight block mb-3"
      >
        {deal.name}
      </Link>

      <div className="flex justify-between items-end border-t border-gray-100 pt-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Wartość</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(deal.value, deal.decimalPlaces)} {deal.currencyCode}
          </p>
        </div>
        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{deal.status}</span>
      </div>
    </div>
  );
};
