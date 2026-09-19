import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Receipt,
  RefreshCw,
  Tag,
  Trash2,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { formatCurrency } from '~/utils/data-formatters';
import { getStatusConfig } from '~/utils/sale-status';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { api } from '~/api/api';
import { Button } from '~/components/ui/button';
import { DeleteDealDialog } from '~/components/deal/delete-deal-dialog';
import { ExtendDealDialog } from '~/components/deal/extend-deal-dialog';
import { ChangeDealStatusDialog } from '~/components/deal/change-deal-status-dialog';
import { ChangeDealContactDialog } from '~/components/deal/change-deal-contact-dialog';

interface SaleDetailResponse {
  id: string;
  name: string;
  value: number;
  status: string;
  closeDate: string;
  currencyCode: string;
  decimalPlaces: number;
  ownerFirstName: string;
  ownerLastName: string;
  companyName: string;
  contactFirstName?: string;
  contactLastName?: string;
  invoicedAmount: number;
  paidAmount: number;
  isOverdueInvoices: boolean;
  paymentPercentage: number;
}

export const DealInfo = ({ dealId }: { dealId: string }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
  const [isChangeContactOpen, setIsChangeContactOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const {
    data: deal,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<SaleDetailResponse>({
    queryKey: ['deal-info', dealId],
    queryFn: async () => {
      const response = await api.get(`/sales/${dealId}`);
      return response.data?.data || response.data?.value || response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/sales/${dealId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['deals-list'] });
      navigate('/sales');
    },
  });

  const extendMutation = useMutation({
    mutationFn: async (newCloseDate: Date) => {
      return await api.put('/sales/extend-close-date', {
        dealId: dealId,
        newCloseDate: newCloseDate.toISOString(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['deal-info', dealId] });
      await queryClient.invalidateQueries({ queryKey: ['deals-list'] });
      setSuccessMessage('Termin transakcji został pomyślnie przedłużony.');
      setIsExtendOpen(false);
    },
  });

  const changeContactMutation = useMutation({
    mutationFn: async (newContactId: string) => {
      return await api.put(`/sales/${dealId}/contact?contactId=${newContactId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['deal-info', dealId] });
      await queryClient.invalidateQueries({ queryKey: ['deals-list'] });
      setSuccessMessage('Osoba kontaktowa została pomyślnie zmieniona.');
      setIsChangeContactOpen(false);
    },
  });

  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  if (isLoading) {
    return (
      <div className="mb-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  const formError: FormErrorState | null =
    (isError || (!isLoading && !deal)) && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message ||
              activeError?.message ||
              'Nie udało się pobrać danych zamówienia.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

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

  if (!deal) return null;

  const status = getStatusConfig(deal.status);
  const isFullyPaid = deal.paidAmount >= deal.value;
  const statusLower = deal.status?.toLowerCase() || '';
  const canModify = !['completed', 'complete', 'cancelled', 'canceled'].includes(statusLower);

  const handleStatusChangeSuccess = (newStatus: string, sentToEmail?: string | null) => {
    if (sentToEmail) {
      setSuccessMessage(
        `Status zmieniony na ${getStatusConfig(newStatus).label}. Faktura została wygenerowana i wysłana na adres: ${sentToEmail}.`,
      );
    } else {
      setSuccessMessage(
        `Status transakcji został zmieniony na: ${getStatusConfig(newStatus).label}.`,
      );
    }
  };

  return (
    <>
      {successMessage && (
        <div className="mb-4 relative flex items-center justify-between p-3.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm shadow-xs transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800 p-0.5 rounded transition-colors"
            title="Zamknij"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                to="/sales"
                className="text-gray-500 hover:text-[#004a8f] transition-colors"
                title="Powrót do listy szans sprzedaży"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl lg:text-3xl font-normal text-[#004a8f]">{deal.name}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 ml-8">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${status.bgColor} ${status.textColor}`}
              >
                <Tag className="w-3.5 h-3.5" />
                {status.label}
              </span>

              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <Calendar className="w-4 h-4" />
                {new Date(deal.closeDate).toLocaleDateString('pl-PL', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>

              {deal.isOverdueInvoices && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-200 shadow-sm">
                  <AlertCircle className="w-4 h-4" />
                  Zaległe płatności!
                </span>
              )}
            </div>
          </div>

          {canModify && (
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsChangeContactOpen(true)}
                className="text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-1.5 text-sm"
              >
                <UserCheck className="w-4 h-4 text-gray-500" />
                Zmień kontakt
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsChangeStatusOpen(true)}
                className="text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-1.5 text-sm"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
                Zmień status
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExtendOpen(true)}
                className="text-[#004a8f] border-blue-200 hover:bg-blue-50 flex items-center gap-1.5 text-sm"
              >
                <Clock className="w-4 h-4" />
                Przedłuż termin
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteOpen(true)}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex items-center gap-1.5 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Usuń
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
                <Building2 className="w-4 h-4 text-gray-400" /> Klient
              </span>
              <span className="text-base text-gray-900 font-semibold">{deal.companyName}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
                  <UserCheck className="w-4 h-4 text-gray-400" /> Kontakt
                </span>
              </div>
              <span className="text-base text-gray-900 font-medium">
                {deal.contactFirstName && deal.contactLastName
                  ? `${deal.contactFirstName} ${deal.contactLastName}`
                  : 'Brak kontaktu'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
                <User className="w-4 h-4 text-gray-400" /> Opiekun
              </span>
              <span className="text-base text-gray-900 font-medium">
                {deal.ownerFirstName} {deal.ownerLastName}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
                <CircleDollarSign className="w-4 h-4 text-gray-400" /> Wartość zamówienia
              </span>
              <span className="text-xl text-gray-900 font-bold tracking-tight">
                {formatCurrency(deal.value, deal.currencyCode, deal.decimalPlaces)}
              </span>
            </div>

            <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-md border border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                  <Receipt className="w-4 h-4 text-gray-400" /> Rozliczenie
                </span>
                <span className={`font-bold ${isFullyPaid ? 'text-green-600' : 'text-[#004a8f]'}`}>
                  {deal.paymentPercentage}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${deal.paymentPercentage >= 100 ? 'bg-green-500' : 'bg-[#004a8f]'}`}
                  style={{ width: `${Math.min(deal.paymentPercentage, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>
                  Opłacono: {formatCurrency(deal.paidAmount, deal.currencyCode, deal.decimalPlaces)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteDealDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
        isLoading={deleteMutation.isPending}
        dealTitle={deal.name}
      />

      <ExtendDealDialog
        isOpen={isExtendOpen}
        onClose={() => setIsExtendOpen(false)}
        onConfirm={async (newDate) => {
          await extendMutation.mutateAsync(newDate);
        }}
        isLoading={extendMutation.isPending}
        dealName={deal.name}
        currentCloseDate={deal.closeDate}
      />

      <ChangeDealStatusDialog
        isOpen={isChangeStatusOpen}
        onClose={() => setIsChangeStatusOpen(false)}
        dealId={dealId}
        currentStatus={deal.status}
        onSuccess={handleStatusChangeSuccess}
      />

      <ChangeDealContactDialog
        isOpen={isChangeContactOpen}
        dealId={dealId}
        onClose={() => setIsChangeContactOpen(false)}
        onSave={async (newContactId) => {
          await changeContactMutation.mutateAsync(newContactId);
        }}
        isLoading={changeContactMutation.isPending}
      />
    </>
  );
};
