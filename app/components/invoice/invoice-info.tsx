import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Download,
  FileText,
  Handshake,
  Plus,
  Receipt,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { api } from '~/api/api';
import { Button } from '~/components/ui/button';
import { formatCurrency } from '~/utils/data-formatters';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { AddInvoicePaymentDialog } from './dialogs/add-invoice-payment-dialog';
import { DownloadInvoicePdfDialog } from './dialogs/download-invoice-pdf-dialog';
import type { InvoiceDetailResponse, InvoicePaymentSummaryResponse } from '~/interfaces/invoice';

const InvoiceLoadingSkeleton = () => (
  <div className="mb-6 animate-pulse">
    <div className="h-10 bg-gray-200 rounded w-1/3 mb-4" />
    <div className="h-36 bg-gray-100 rounded-lg" />
  </div>
);

interface InvoiceStatusBadgeProps {
  isFullyPaid: boolean;
  isOverDue: boolean;
}

const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ isFullyPaid, isOverDue }) => {
  if (isFullyPaid) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 bg-green-100 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Opłacona
      </span>
    );
  }

  if (isOverDue) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 bg-red-100 text-red-700 border border-red-200">
        <AlertCircle className="w-3.5 h-3.5" />
        Przeterminowana
      </span>
    );
  }

  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200">
      <CreditCard className="w-3.5 h-3.5" />
      Do zapłaty
    </span>
  );
};

const resolveInvoiceError = (
  isInvoiceError: boolean,
  isInvoiceLoading: boolean,
  hasInvoice: boolean,
  isErrorDismissed: boolean,
  activeError: ApiError | null,
): FormErrorState | null => {
  if (isErrorDismissed) return null;

  const hasFailed = isInvoiceError || (!isInvoiceLoading && !hasInvoice);
  if (!hasFailed) return null;

  const responseData = activeError?.response?.data;
  const message =
    responseData?.message || activeError?.message || 'Nie udało się pobrać szczegółów faktury.';
  const details =
    responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined;

  return {
    title: getErrorMessage(responseData?.errorCode, message),
    details,
  };
};

export const InvoiceInfo = ({ invoiceId }: { invoiceId: string }) => {
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isDownloadPdfOpen, setIsDownloadPdfOpen] = useState(false);

  const {
    data: invoice,
    isLoading: isInvoiceLoading,
    isError: isInvoiceError,
    error: invoiceQueryError,
  } = useQuery<InvoiceDetailResponse>({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: async () => {
      const response = await api.get(`/invoice/${invoiceId}`);
      return response.data?.data || response.data?.value || response.data;
    },
  });

  const { data: summary, isLoading: isSummaryLoading } = useQuery<InvoicePaymentSummaryResponse>({
    queryKey: ['invoice-payment-summary', invoiceId],
    queryFn: async () => {
      const response = await api.get(`/invoice/${invoiceId}/payment/summary`);
      return response.data?.data || response.data?.value || response.data;
    },
  });

  const activeError = invoiceQueryError as ApiError | null;

  useEffect(() => {
    if (isInvoiceError) {
      setIsErrorDismissed(false);
    }
  }, [isInvoiceError, invoiceQueryError]);

  if (isInvoiceLoading || isSummaryLoading) {
    return <InvoiceLoadingSkeleton />;
  }

  const formError = resolveInvoiceError(
    isInvoiceError,
    isInvoiceLoading,
    Boolean(invoice),
    isErrorDismissed,
    activeError,
  );

  if (formError) {
    return (
      <div className="mb-6 relative flex items-start gap-2.5 p-3.5 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1 pr-4">
          <p className="font-medium leading-tight">{formError.title}</p>
          {formError.details && (
            <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
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
    );
  }

  if (!invoice) return null;

  const currency = summary?.currencyCode || 'PLN';
  const decimals = summary?.decimalPlaces ?? 2;
  const total = summary?.totalAmount ?? 0;
  const paid = summary?.paidAmount ?? 0;
  const remaining = summary?.remainingAmount ?? 0;
  const isFullyPaid = total > 0 && remaining <= 0;
  const isOverDue = summary?.isOverDue ?? false;

  const paymentPercentage = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/invoices"
              className="text-gray-500 hover:text-blue-900 transition-colors"
              title="Powrót do listy faktur"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl lg:text-3xl font-bold text-blue-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-900" />
              {invoice.invoiceNumber}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 ml-8">
            <InvoiceStatusBadge isFullyPaid={isFullyPaid} isOverDue={isOverDue} />

            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              Wystawiono: {format(new Date(invoice.issueDate), 'dd MMMM yyyy', { locale: pl })}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
                isOverDue ? 'bg-red-50 text-red-700 font-bold' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Termin: {format(new Date(invoice.dueDate), 'dd MMMM yyyy', { locale: pl })}
            </span>

            {invoice.paymentDate && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Rozliczono: {format(new Date(invoice.paymentDate), 'dd.MM.yyyy')}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDownloadPdfOpen(true)}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-900" />
            <span>Pobierz PDF</span>
          </Button>

          {!isFullyPaid && (
            <Button
              type="button"
              onClick={() => setIsAddPaymentOpen(true)}
              className="bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-2 text-sm shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Zarejestruj wpłatę</span>
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
              <Building2 className="w-4 h-4 text-gray-400" /> Nabywca
            </span>
            <Link
              to={`/company/${invoice.companyId}`}
              className="text-base text-blue-900 font-semibold hover:underline"
            >
              {invoice.companyName}
            </Link>
            <span className="text-xs text-gray-500">NIP: {invoice.companyNip}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
              <Handshake className="w-4 h-4 text-gray-400" /> Szansa sprzedaży
            </span>
            {invoice.dealId ? (
              <Link
                to={`/sales/${invoice.dealId}`}
                className="text-base text-blue-900 font-medium hover:underline"
              >
                {invoice.dealName || 'Zobacz zamówienie'}
              </Link>
            ) : (
              <span className="text-base text-gray-400 italic">Brak powiązania</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
              <CircleDollarSign className="w-4 h-4 text-gray-400" /> Wartość faktury
            </span>
            <span className="text-xl text-gray-900 font-bold tracking-tight">
              {formatCurrency(total, currency, decimals)}
            </span>
            <span className="text-xs text-gray-500">
              Pozostało:{' '}
              <strong className={remaining > 0 ? 'text-amber-700' : 'text-gray-900'}>
                {formatCurrency(remaining, currency, decimals)}
              </strong>
            </span>
          </div>

          <div className="flex flex-col gap-2 bg-gray-50 p-3.5 rounded-md border border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                <Receipt className="w-4 h-4 text-gray-400" /> Stan rozliczenia
              </span>
              <span className={`font-bold ${isFullyPaid ? 'text-green-600' : 'text-blue-900'}`}>
                {paymentPercentage}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full ${isFullyPaid ? 'bg-green-500' : 'bg-blue-900'}`}
                style={{ width: `${paymentPercentage}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Opłacono: {formatCurrency(paid, currency, decimals)}</span>
              <span>Wpłat: {summary?.paymentsCount ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      <AddInvoicePaymentDialog
        isOpen={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        invoiceId={invoiceId}
        remainingAmount={remaining}
        currencyCode={currency}
        decimalPlaces={decimals}
      />

      <DownloadInvoicePdfDialog
        isOpen={isDownloadPdfOpen}
        onClose={() => setIsDownloadPdfOpen(false)}
        invoiceId={invoiceId}
        invoiceNumber={invoice.invoiceNumber}
      />
    </div>
  );
};
