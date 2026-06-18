import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { Loader2 } from 'lucide-react';

interface ContactBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  companyName: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  isPrimary: boolean;
}

export const ContactHeader: React.FC<{ contactId: string }> = ({ contactId }) => {
  const {
    data: info,
    isLoading,
    isError,
  } = useQuery<ContactBasicInfo>({
    queryKey: ['contact-details', contactId],
    queryFn: async () => {
      const res = await api.get(`/contacts/${contactId}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[#004a8f] mb-6 lg:mb-8">
        <Loader2 className="animate-spin w-6 h-6" />
        <span className="text-sm font-medium">Ładowanie danych kontaktu...</span>
      </div>
    );
  }

  if (isError || !info) {
    return (
      <div className="text-red-500 font-medium mb-6 lg:mb-8">Błąd ładowania danych kontaktu.</div>
    );
  }

  return (
    <div className="mb-6 lg:mb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
        {/* Lewa strona: Dane osobowe */}
        <div>
          <h1 className="text-4xl font-normal text-gray-900 leading-tight">
            {info.firstName} {info.lastName}
          </h1>
          <p className="text-lg text-gray-900 mt-1.5">{info.companyName}</p>
          {info.jobTitle && (
            <p className="text-sm font-medium text-[#004a8f] mt-0.5">{info.jobTitle}</p>
          )}
        </div>

        {/* Prawa strona: Tagi i opiekun */}
        <div className="flex flex-col items-start lg:items-end gap-2 mt-2 lg:mt-0">
          <div
            className={`inline-block px-3 py-1 rounded-full ${
              info.isPrimary ? 'bg-[#d4edda] text-[#28a745]' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <span className="font-medium text-sm">
              {info.isPrimary ? 'Główny kontakt' : 'Kontakt dodatkowy'}
            </span>
          </div>

          {(info.ownerFirstName || info.ownerLastName) && (
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
              Opiekun:{' '}
              <span className="font-medium text-gray-700">
                {info.ownerFirstName} {info.ownerLastName}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
