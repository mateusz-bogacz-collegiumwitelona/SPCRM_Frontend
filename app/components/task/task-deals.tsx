import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { AlertCircle, Briefcase, X } from 'lucide-react';
import { Link } from 'react-router';
import { formatCurrency } from '~/utils/data-formatters';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

interface TaskDealResponse {
  dealId: string;
  name: string;
  value: number;
  status: string;
  closeDate: string;
  currencyCode: string;
  decimalPlaces: number;
}

export const TaskDeals = ({ taskId }: { taskId: string }) => {
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  const {
    data: deal,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<TaskDealResponse>({
    queryKey: ['task-deal', taskId],
    queryFn: async () => {
      const response = await api.get(`/tasks/${taskId}/deal`);
      return response.data?.data || response.data?.value || response.data;
    },
    retry: false,
  });

  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  const formError: FormErrorState | null =
    isError && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message ||
              activeError?.message ||
              'Nie udało się pobrać danych transakcji.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  if (isLoading) return <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>;

  if (formError) {
    return (
      <div className="relative flex items-start gap-2.5 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1 pr-4">
          <p className="font-medium leading-tight">{formError.title}</p>
          {formError.details && formError.details.length > 0 && (
            <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
              {formError.details.map((detailErr, idx) => (
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
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

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
            {formatCurrency(deal.value, deal.currencyCode, deal.decimalPlaces)}
          </p>
        </div>
        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{deal.status}</span>
      </div>
    </div>
  );
};
