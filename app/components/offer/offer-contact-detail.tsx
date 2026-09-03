import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { AlertCircle, Building2, Contact, ExternalLink, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

interface OfferClientDetailResponse {
  contactId: string;
  contactFirstName: string;
  contactLastName: string;
  contactJobTitle?: string;
  companyName: string;
}

export const OfferClientDetail: React.FC<{ offerId: string }> = ({ offerId }) => {
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  const {
    data: info,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<OfferClientDetailResponse>({
    queryKey: ['offer-client-detail', offerId],
    queryFn: async () => {
      const res = await api.get(`/offer/client/${offerId}`);
      return res.data?.data || res.data?.value || res.data;
    },
    enabled: Boolean(offerId),
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
              'Nie udało się pobrać danych osoby kontaktowej klienta.',
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
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-8 bg-gray-200 rounded w-36"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-16 bg-gray-100 rounded-lg"></div>
          <div className="h-16 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

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

  if (!info) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center gap-2 text-gray-900">
          <Contact className="w-5 h-5 text-[#004a8f]" />
          <h2 className="text-lg font-bold text-gray-900">Osoba kontaktowa klienta</h2>
        </div>

        <Link
          to={`/contact/${info.contactId}`}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#004a8f] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
        >
          <span>Profil kontaktu</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3.5 p-3.5 rounded-lg border border-gray-100 bg-[#f8f9fa]">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#004a8f] flex items-center justify-center shrink-0 font-bold text-sm">
            {info.contactFirstName.charAt(0)}
            {info.contactLastName.charAt(0)}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Imię i nazwisko</p>
            <p className="text-sm font-semibold text-gray-900">
              {info.contactFirstName} {info.contactLastName}
            </p>
            {info.contactJobTitle && (
              <p className="text-xs text-gray-500">{info.contactJobTitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 rounded-lg border border-gray-100 bg-[#f8f9fa]">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#004a8f] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Firma docelowa</p>
            <p className="text-sm font-semibold text-gray-900">{info.companyName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
