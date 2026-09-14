import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { AlertCircle, FileText, Loader2, RefreshCw, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { getStatusConfig } from '~/utils/sale-status';

interface ChangeDealStatusDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly dealId: string;
  readonly currentStatus: string;
  readonly onSuccess: (newStatus: string, sentToEmail?: string | null) => void;
}

interface ChangeStatusResponse {
  status: string;
  sentToEmail?: string | null;
}

export const ChangeDealStatusDialog: React.FC<ChangeDealStatusDialogProps> = ({
  isOpen,
  onClose,
  dealId,
  currentStatus,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [language, setLanguage] = useState<string>('pl');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  // Pobranie dostępnych statusów z backendu (GET /sales/statuses)
  const { data: availableStatuses = [], isLoading: isLoadingStatuses } = useQuery<string[]>({
    queryKey: ['deal-statuses'],
    queryFn: async () => {
      const res = await api.get('/sales/statuses');
      return res.data?.data || res.data?.value || res.data || [];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus('');
      setLanguage('pl');
      setCustomEmail('');
      setFormError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const isTransitionToComplete =
    selectedStatus.toLowerCase() === 'complete' || selectedStatus.toLowerCase() === 'completed';

  const changeStatusMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        targetStatus: selectedStatus,
        language: isTransitionToComplete ? language : undefined,
        customRecipientEmail:
          isTransitionToComplete && customEmail.trim() ? customEmail.trim() : undefined,
      };

      const res = await api.put(`/sales/${dealId}/status`, payload);
      return (res.data?.data || res.data?.value || res.data) as ChangeStatusResponse;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['deal-info', dealId] });
      await queryClient.invalidateQueries({ queryKey: ['deals-list'] });
      handleClose();
      onSuccess(data?.status || selectedStatus, data?.sentToEmail);
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;
      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zmienić statusu transakcji.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedStatus) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Wybierz nowy status transakcji.'],
      });
      return;
    }

    if (selectedStatus === currentStatus) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Nowy status musi być inny niż obecny.'],
      });
      return;
    }

    changeStatusMutation.mutate();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !changeStatusMutation.isPending && handleClose()}
    >
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#004a8f] text-lg font-semibold flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#004a8f]" />
            Zmień status transakcji
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
          {formError && (
            <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
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
                onClick={() => setFormError(null)}
                className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                title="Zamknij"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Obecny status */}
          <div className="p-3 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Obecny status:</span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
              {getStatusConfig(currentStatus).label}
            </span>
          </div>

          {/* Wybór nowego statusu */}
          <div>
            <label
              htmlFor="deal-status-select"
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Nowy status *
            </label>
            {isLoadingStatuses ? (
              <div className="flex h-10 items-center justify-center border border-gray-200 rounded-md">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <select
                id="deal-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              >
                <option value="">Wybierz docelowy status...</option>
                {availableStatuses
                  .filter((st) => st !== currentStatus)
                  .map((st) => (
                    <option key={st} value={st}>
                      {getStatusConfig(st).label} ({st})
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Sekcja opcji fakturowania przy przejściu na Complete */}
          {isTransitionToComplete && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-start gap-2 text-blue-900 text-xs">
                <FileText className="w-4 h-4 text-[#004a8f] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Zakończenie transakcji sukcesem wygeneruje <strong>fakturę VAT</strong> i wyśle ją
                  do klienta.
                </p>
              </div>

              <div>
                <label
                  htmlFor="invoice-lang"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Język szablonu faktury
                </label>
                <select
                  id="invoice-lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                >
                  <option value="pl">Polski (PL)</option>
                  <option value="en">Angielski (EN)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="invoice-custom-email"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Niestandardowy adres e-mail do faktury (opcjonalnie)
                </label>
                <Input
                  id="invoice-custom-email"
                  type="email"
                  placeholder="np. ksiegowosc@klient.pl"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Pozostaw puste, aby wysłać na domyślny adres klienta.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={changeStatusMutation.isPending}
              className="text-gray-700 border-gray-300"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={changeStatusMutation.isPending || !selectedStatus}
              className="bg-[#004a8f] text-white hover:bg-[#003870] flex items-center gap-2"
            >
              {changeStatusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Zmień status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
