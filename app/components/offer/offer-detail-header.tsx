import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { AlertCircle, Building2, Calendar, Clock, User, X } from 'lucide-react';
import { getStatusBadge } from '~/utils/offer-status-helper';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

interface OfferDetailHeaderProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  basicInfo?: {
    offerName: string;
    companyName: string;
    status: string;
    validUntil: string;
    isExpired: boolean;
    createdByUserFirstName: string;
    createdByUserLastName: string;
  };
}

export const OfferDetailHeader: React.FC<OfferDetailHeaderProps> = ({
  isLoading,
  isError,
  error,
  basicInfo,
}) => {
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, error]);

  const activeError = error as ApiError | null;
  const responseData = activeError?.response?.data;

  const formError: FormErrorState | null =
    (isError || (!isLoading && !basicInfo)) && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message || activeError?.message || 'Nie udało się pobrać danych oferty.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm animate-pulse">
        <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-7 bg-gray-200 rounded-full w-28"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (formError) {
    return (
      <div className="mb-6 relative flex items-start gap-2.5 p-3.5 text-red-800 bg-red-50 border border-red-200 rounded-xl text-sm shadow-xs transition-all">
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
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!basicInfo) {
    return null;
  }

  const formattedDate = basicInfo.validUntil
    ? format(new Date(basicInfo.validUntil), 'dd MMMM yyyy', { locale: pl })
    : '-';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-[#004a8f] tracking-tight">
              {basicInfo.offerName}
            </h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900">{basicInfo.companyName}</span>
          </p>
        </div>

        <div>{getStatusBadge(basicInfo.status, basicInfo.isExpired)}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 bg-[#f8f9fa] rounded-lg p-3 border border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#004a8f] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Termin ważności</p>
            <p className="text-sm font-semibold text-gray-900">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#f8f9fa] rounded-lg p-3 border border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#004a8f] flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Opiekun oferty</p>
            <p className="text-sm font-semibold text-gray-900">
              {basicInfo.createdByUserFirstName} {basicInfo.createdByUserLastName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#f8f9fa] rounded-lg p-3 border border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#004a8f] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Status czasowy</p>
            <p
              className={`text-sm font-semibold ${
                basicInfo.isExpired ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {basicInfo.isExpired ? 'Przeterminowana' : 'Aktywna do dyspozycji'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
