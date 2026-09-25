import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Loader2, UserCheck, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import type { DealAssignableContactResponse } from '~/interfaces/deal';

interface ChangeDealContactDialogProps {
  isOpen: boolean;
  dealId: string;
  onClose: () => void;
  onSave: (newContactId: string) => Promise<void>;
  isLoading?: boolean;
}

export const ChangeDealContactDialog: React.FC<ChangeDealContactDialogProps> = ({
  isOpen,
  dealId,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const {
    data: contacts = [],
    isLoading: isContactsLoading,
    isError: isContactsError,
  } = useQuery({
    queryKey: ['deal-assignable-contacts', dealId],
    queryFn: async () => {
      const res = await api.get(`/sales/${dealId}/assignable-contacts`);
      return res.data.data as DealAssignableContactResponse[];
    },
    enabled: isOpen && Boolean(dealId),
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedContactId('');
      setFormError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedContactId) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: ['Proszę wybrać osobę kontaktową z listy.'],
      });
      return;
    }

    try {
      await onSave(selectedContactId);
      onClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się zmienić osoby kontaktowej.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  const renderContent = () => {
    if (isContactsLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-brand mb-4" />
          <p className="text-gray-500 text-sm">Pobieranie listy kontaktów firmy...</p>
        </div>
      );
    }

    if (isContactsError) {
      return (
        <div className="py-8 text-center text-red-500 text-sm font-medium">
          Nie udało się pobrać dostępnych kontaktów. Spróbuj ponownie później.
        </div>
      );
    }

    if (contacts.length === 0) {
      return (
        <div className="py-8 text-center text-gray-500 text-sm">
          Firma przypisana do tej szansy sprzedaży nie posiada innych kontaktów z aktywnym adresem
          e-mail.
        </div>
      );
    }

    const selectedContact = contacts.find((c) => c.id === selectedContactId);

    return (
      <form onSubmit={handleSubmit} noValidate className="space-y-6 pt-4 pb-2">
        {formError && (
          <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 pr-4">
              <p className="font-medium leading-tight">{formError.title}</p>
              {formError.details && formError.details.length > 0 && (
                <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                  {formError.details.map((detailErr, idx) => (
                    <li key={`${detailErr}-${idx}`}>{detailErr}</li>
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

        <div className="space-y-2">
          <label htmlFor="new-deal-contact" className="text-sm font-medium text-gray-700">
            Wybierz nową osobę kontaktową *
          </label>
          <select
            id="new-deal-contact"
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="w-full max-w-full min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand bg-white truncate"
            required
          >
            <option value="" disabled>
              -- Wybierz kontakt --
            </option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.fullName} {contact.isPrimary ? '(Główny kontakt)' : ''}
              </option>
            ))}
          </select>

          {selectedContact && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1 mt-2">
              <div className="font-semibold text-slate-800 text-sm flex items-center justify-between">
                <span>{selectedContact.fullName}</span>
                {selectedContact.isPrimary && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                    Kontakt główny
                  </span>
                )}
              </div>
              {selectedContact.jobTitle && (
                <p>
                  <span className="text-slate-400">Stanowisko:</span> {selectedContact.jobTitle}
                </p>
              )}
              <p>
                <span className="text-slate-400">Email:</span> {selectedContact.email}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-1">
            Wybrany kontakt zostanie powiązany z tą szansą sprzedaży oraz otrzyma powiadomienia i
            dokumenty.
          </p>
        </div>

        <DialogFooter className="border-t border-gray-100 pt-4 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-700 border-gray-300"
          >
            Anuluj
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !selectedContactId}
            className="bg-brand text-white hover:bg-blue-800 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Zapisz zmiany
          </Button>
        </DialogFooter>
      </form>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="border-b border-gray-100 pb-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mt-2">
            <UserCheck className="w-6 h-6 text-blue-900" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Zmień osobę kontaktową
          </DialogTitle>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
