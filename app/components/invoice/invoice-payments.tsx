import React, { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertCircle, Calendar, Hash, Receipt, User, X } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { TablePagination } from '~/components/table/table-pagination';
import { TableEmptyState, TableLoadingState } from '~/components/table/table-state-views';
import { formatCurrency } from '~/utils/data-formatters';
import type { InvoicePaymentListResponse } from '~/interfaces/invoice';

export const InvoicePaymentsList = ({ invoiceId }: { readonly invoiceId: string }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch, pageSize]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ['invoice-payments', invoiceId, { pageNumber, pageSize, debouncedSearch }],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
      };

      const response = await api.get(`/invoice/${invoiceId}/payment`, { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const payments: InvoicePaymentListResponse[] = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || payments.length;

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
            responseData?.message || activeError?.message || 'Nie udało się pobrać listy wpłat.',
          ),
          details: responseData?.errors,
        }
      : null;

  let invoicePaymentData: React.ReactNode;

  if (isLoading) {
    invoicePaymentData = <TableLoadingState message="Ładowanie listy wpłat..." />;
  } else if (payments.length === 0) {
    invoicePaymentData = <TableEmptyState message="Brak wpłat do wyświetlenia." />;
  } else {
    invoicePaymentData = (
      <div className="space-y-2.5">
        {payments.map((p) => (
          <div
            key={p.paymentId}
            className="p-3 border border-gray-200 rounded-lg hover:border-blue-200 hover:shadow-xs transition-all bg-white"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-green-700">
                  +{formatCurrency(p.amount, p.currencyCode, p.decimalPlaces)}
                </span>
                {p.referenceNumber && (
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                    <Hash className="w-3 h-3 text-gray-400" />
                    {p.referenceNumber}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>{format(new Date(p.paymentDate), 'dd.MM.yyyy')}</span>
              </div>
            </div>

            {p.note && <p className="text-xs text-gray-700 my-1 italic">{p.note}</p>}

            {(p.createdByFirstName || p.createdByLastName) && (
              <div className="flex items-center gap-1 text-[11px] text-gray-400 pt-1.5 mt-1 border-t border-gray-100">
                <User className="w-3 h-3 text-gray-400" />
                <span>
                  Zarejestrował: {p.createdByFirstName} {p.createdByLastName}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50/60 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Historia wpłat</h2>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
              {totalItems}
            </span>
          </div>
        </div>

        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Szukaj wpłaty (ref, notatka, kwota, nazwisko)..."
            className="w-full border border-gray-300 rounded-md bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-900"
          />
        </div>
      </div>

      {formError && (
        <div className="m-4 relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-xs shadow-xs transition-all">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 pr-4">
            <p className="font-medium leading-tight">{formError.title}</p>
            {formError.details && formError.details.length > 0 && (
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs text-red-700">
                {formError.details.map((detailErr, idx) => (
                  <li key={`${detailErr}-${idx}`}>{detailErr}</li>
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
      )}

      <div className="p-4 space-y-3">{invoicePaymentData}</div>

      {!isLoading && totalItems > 0 && (
        <TablePagination
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalPages={totalPages}
          totalItems={totalItems}
          isFetching={isFetching}
          onPageChange={setPageNumber}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20]}
        />
      )}
    </div>
  );
};
