import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import React from 'react';
import { Building2, Calendar, Clock, User } from 'lucide-react';
import { getStatusBadge } from '~/components/offer/offer-status-badge';
import { QueryErrorBanner } from '~/components/ui/query-error-banner';

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

  if (isError) {
    return (
      <QueryErrorBanner
        error={error}
        fallbackMessage="Nie udało się pobrać danych zamówienia."
        className="mb-6"
      />
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
            <h1 className="text-2xl lg:text-3xl font-bold text-brand tracking-tight">
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
        <div className="flex items-center gap-3 bg-layout-bg rounded-lg p-3 border border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-brand flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Termin ważności</p>
            <p className="text-sm font-semibold text-gray-900">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-layout-bg rounded-lg p-3 border border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-brand flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Opiekun oferty</p>
            <p className="text-sm font-semibold text-gray-900">
              {basicInfo.createdByUserFirstName} {basicInfo.createdByUserLastName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-layout-bg rounded-lg p-3 border border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-brand flex items-center justify-center shrink-0">
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
