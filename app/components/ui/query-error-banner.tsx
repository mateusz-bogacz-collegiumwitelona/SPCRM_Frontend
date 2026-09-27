import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { getErrorMessage } from '~/constants/error-mapper';
import type { ApiError } from '~/types/api-error';

interface QueryErrorBannerProps {
  readonly error: unknown;
  readonly fallbackMessage?: string;
  readonly className?: string;
}

export function QueryErrorBanner({
  error,
  fallbackMessage = 'Wystąpił nieoczekiwany błąd.',
  className = '',
}: QueryErrorBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (error) {
      setIsDismissed(false);
    }
  }, [error]);

  if (!error || isDismissed) return null;

  const apiError = error as ApiError | null;
  const responseData = apiError?.response?.data;

  const title = getErrorMessage(
    responseData?.errorCode,
    responseData?.message || apiError?.message || fallbackMessage,
  );
  const details =
    responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined;

  return (
    <div
      className={`relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all ${className}`}
    >
      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1 pr-4">
        <p className="font-medium leading-tight">{title}</p>
        {details && (
          <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
            {details.map((detailErr, idx) => (
              <li key={`${detailErr}-${idx}`}>{detailErr}</li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
        title="Zamknij"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
