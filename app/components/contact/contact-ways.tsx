import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { getIcon, getTypePrefix } from '~/utils/contact-helpers';
import { type ContactWay } from '~/interfaces/contact-way';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { AlertCircle, X } from 'lucide-react';

const ContactWayItem = ({ way }: { way: ContactWay }) => (
  <li className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-800">
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
);

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

  const [isErrorDismissed, setIsErrorDismissed] = React.useState(false);

  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  React.useEffect(() => {
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
              'Nie udało się pobrać danych kontaktowych.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  if (formError) {
    return (
      <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
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

  if (isLoading || !ways || ways.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <ul className="space-y-4 sm:space-y-3">
        {ways.map((way) => (
          <ContactWayItem key={`${way.type}-${way.value}`} way={way} />
        ))}
      </ul>
    </div>
  );
};
