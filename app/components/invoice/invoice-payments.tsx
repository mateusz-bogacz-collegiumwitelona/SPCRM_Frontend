import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Hash, Receipt, User } from 'lucide-react';
import { format } from 'date-fns';
import { TablePagination } from '~/components/table/table-pagination';
import { TableEmptyState, TableLoadingState } from '~/components/table/table-state-views';
import { formatCurrency } from '~/utils/data-formatters';
import type { InvoicePaymentListResponse } from '~/types/invoice';
import { useInvoicePayments } from '~/hooks/use-invoices';
import { useDebounce } from '~/hooks/use-debounce';
import { QueryErrorBanner } from '~/components/ui/query-error-banner';

export const InvoicePaymentsList = ({ invoiceId }: { readonly invoiceId: string }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch, pageSize]);

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useInvoicePayments({
    invoiceId,
    pageNumber,
    pageSize,
    debouncedSearch,
  });

  const payments: InvoicePaymentListResponse[] = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || payments.length;

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
      <QueryErrorBanner
        error={queryError}
        fallbackMessage="Nie udało się pobrać szczegółów faktury."
        className="mb-6"
      />
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
