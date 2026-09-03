import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CircleDollarSign,
  Receipt,
  Tag,
  User,
  X,
} from 'lucide-react';
import { formatCurrency } from '~/utils/data-formatters';
import { getStatusConfig } from '~/utils/sale-status';

import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';

interface SaleDetailResponse {
  id: string;
  name: string;
  value: number;
  status: string;
  closeDate: string;
  currencyCode: string;
  decimalPlaces: number;
  ownerFirstName: string;
  ownerLastName: string;
  companyName: string;
  invoicedAmount: number;
  paidAmount: number;
  isOverdueInvoices: boolean;
  paymentPercentage: number;
}

export const SaleInfo = ({ dealId }: { dealId: string }) => {
  const {
    data: deal,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<SaleDetailResponse>({
    queryKey: ['deal-info', dealId],
    queryFn: async () => {
      const response = await api.get(`/sales/${dealId}`);
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="mb-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  const formError: FormErrorState | null =
    (isError || (!isLoading && !deal)) && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message ||
              activeError?.message ||
              'Nie udało się pobrać danych zamówienia.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  if (formError) {
    return (
      <div className="mb-6 relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
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

  const status = getStatusConfig(deal.status);
  const isFullyPaid = deal.paidAmount >= deal.value;

  return (
    <div className="mb-6">
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-normal text-[#004a8f] mb-4">{deal.name}</h1>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${status.bgColor} ${status.textColor}`}
          >
            <Tag className="w-3.5 h-3.5" />
            {status.label}
          </span>

          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <Calendar className="w-4 h-4" />
            {new Date(deal.closeDate).toLocaleDateString('pl-PL', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </span>

          {deal.isOverdueInvoices && (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-200 shadow-sm">
              <AlertCircle className="w-4 h-4" />
              Zaległe płatności!
            </span>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
              <Building2 className="w-4 h-4 text-gray-400" /> Klient
            </span>
            <span className="text-base text-gray-900 font-semibold">{deal.companyName}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
              <User className="w-4 h-4 text-gray-400" /> Opiekun
            </span>
            <span className="text-base text-gray-900 font-medium">
              {deal.ownerFirstName} {deal.ownerLastName}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
              <CircleDollarSign className="w-4 h-4 text-gray-400" /> Wartość zamówienia
            </span>
            <span className="text-xl text-gray-900 font-bold tracking-tight">
              {formatCurrency(deal.value, deal.currencyCode, deal.decimalPlaces)}
            </span>
          </div>

          <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-md border border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                <Receipt className="w-4 h-4 text-gray-400" /> Rozliczenie
              </span>
              <span className={`font-bold ${isFullyPaid ? 'text-green-600' : 'text-[#004a8f]'}`}>
                {deal.paymentPercentage}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full ${deal.paymentPercentage >= 100 ? 'bg-green-500' : 'bg-[#004a8f]'}`}
                style={{ width: `${Math.min(deal.paymentPercentage, 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                Opłacono: {formatCurrency(deal.paidAmount, deal.currencyCode, deal.decimalPlaces)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
