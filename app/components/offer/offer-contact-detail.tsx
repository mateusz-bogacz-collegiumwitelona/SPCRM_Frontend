import React from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { Building2, Contact, ExternalLink } from 'lucide-react';

interface OfferClientDetailResponse {
  contactId: string;
  contactFirstName: string;
  contactLastName: string;
  contactJobTitle?: string;
  companyName: string;
}

export const OfferClientDetail: React.FC<{ offerId: string }> = ({ offerId }) => {
  const {
    data: info,
    isLoading,
    isError,
  } = useQuery<OfferClientDetailResponse>({
    queryKey: ['offer-client-detail', offerId],
    queryFn: async () => {
      const res = await api.get(`/offer/client/${offerId}`);
      return res.data?.data || res.data?.value || res.data;
    },
    enabled: Boolean(offerId),
  });

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

  if (isError || !info) {
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
