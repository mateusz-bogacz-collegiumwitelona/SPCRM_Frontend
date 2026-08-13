import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { getIcon, getTypePrefix } from '~/utils/contact-helpers';
import { type ContactWay } from '~/interfaces/contact-way';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/apiError';
import { AlertCircle } from 'lucide-react';

export const ContactWays: React.FC<{ contactId: string }> = ({ contactId }) => {
  const {
    data: ways,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<ContactWay[]>({
    queryKey: ['contact-ways', contactId],
    queryFn: async () => {
      const res = await api.get(`/contacts/${contactId}/ways`);
      return res.data.data;
    },
  });

  const errorMessage = isError
    ? getErrorMessage(
        (queryError as ApiError)?.response?.data?.errorCode,
        'Nie udało się pobrać danych kontaktowych.',
      )
    : null;

  if (errorMessage) {
    return (
      <div className="flex items-center gap-2 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="font-medium">{errorMessage}</p>
      </div>
    );
  }

  if (isLoading || !ways || ways.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <ul className="space-y-4 sm:space-y-3">
        {ways.map((way, index) => (
          <li
            key={index}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-800"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 flex-1 min-w-0">
              <div className="flex items-center shrink-0">
                {getIcon(way.type)}
                <span className="font-medium">{getTypePrefix(way.type)}</span>
              </div>

              <span className="break-all sm:break-normal">{way.value}</span>

              {way.label && <span className="text-xs text-gray-400">({way.label})</span>}
            </div>

            {way.isPrimary && (
              <div className="shrink-0 self-start sm:self-auto">
                <span className="text-[10px] uppercase tracking-wider bg-[#d4edda] text-[#28a745] px-2 py-0.5 rounded-full">
                  Główny
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
