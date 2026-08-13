import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export interface EditContactDetailRequest {
  contactDetailId: string | null;
  label: string;
  value: string;
  isPrimary: boolean;
  type: string;
}

export interface EditContactRequest {
  contactId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  details: EditContactDetailRequest[];
}

interface EditContactDialogProps {
  contactId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: EditContactRequest) => Promise<void>;
  isLoading?: boolean;
}

export interface ContactDetailResponse {
  contactDetailId: string;
  label: string;
  value: string;
  isPrimary: boolean;
  type: string;
}

export const EditContactDialog: React.FC<EditContactDialogProps> = ({
  contactId,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [details, setDetails] = useState<EditContactDetailRequest[]>([]);

  const { data: contactData, isLoading: isFetchingContact } = useQuery({
    queryKey: ['contact-edit-detail', contactId],
    queryFn: async () => {
      const res = await api.get(`/contacts/${contactId}/detail`);
      return res.data.data;
    },
    enabled: isOpen && !!contactId,
  });

  const { data: contactTypes = [], isLoading: isTypesLoading } = useQuery({
    queryKey: ['contact-types'],
    queryFn: async () => {
      const res = await api.get('/contacts/types');
      return res.data.data as string[];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (contactData && isOpen) {
      setFirstName(contactData.firstName || '');
      setLastName(contactData.lastName || '');
      setJobTitle(contactData.jobTitle || '');

      if (contactData.details && contactData.details.length > 0) {
        setDetails(
          contactData.details.map((d: ContactDetailResponse) => ({
            contactDetailId: d.contactDetailId,
            label: d.label || '',
            value: d.value || '',
            type: d.type || '',
            isPrimary: d.isPrimary || false,
          })),
        );
      } else {
        setDetails([{ contactDetailId: null, label: '', value: '', type: '', isPrimary: true }]);
      }
    }
  }, [contactData, isOpen]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setJobTitle('');
    setDetails([]);
  };

  const handleAddDetail = () => {
    setDetails([
      ...details,
      { contactDetailId: null, label: '', value: '', type: '', isPrimary: false },
    ]);
  };

  const handleRemoveDetail = (indexToRemove: number) => {
    const newDetails = details.filter((_, index) => index !== indexToRemove);
    if (newDetails.length > 0 && !newDetails.some((d) => d.isPrimary))
      newDetails[0].isPrimary = true;
    setDetails(newDetails);
  };

  const handleDetailChange = (
    index: number,
    field: keyof EditContactDetailRequest,
    newValue: string | boolean,
  ) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: newValue };
    setDetails(newDetails);
  };

  const handleSetPrimary = (indexToSet: number) => {
    const newDetails = details.map((detail, index) => ({
      ...detail,
      isPrimary: index === indexToSet,
    }));
    setDetails(newDetails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactId) return;

    const isAnyDetailInvalid = details.some(
      (d) => !d.label.trim() || !d.value.trim() || !d.type.trim(),
    );

    if (!firstName.trim() || !lastName.trim() || isAnyDetailInvalid || details.length === 0) {
      alert('Proszę poprawnie wypełnić wszystkie wymagane pola we wszystkich detalach.');
      return;
    }

    const payload: EditContactRequest = {
      contactId,
      firstName,
      lastName,
      jobTitle,
      details,
    };

    await onSave(payload);
    resetForm();
    onClose();
  };

  const isModalLoading = isFetchingContact || isTypesLoading;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-[#004a8f]">Edytuj kontakt</DialogTitle>
        </DialogHeader>

        {isModalLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#004a8f] mb-4" />
            <p className="text-gray-500 text-sm">Pobieranie danych kontaktu...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 border-b pb-1">Dane osobowe</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Imię *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Nazwisko *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Stanowisko</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-1">
                <h3 className="text-sm font-semibold text-gray-800">Szczegóły kontaktowe</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDetail}
                  className="h-7 text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Dodaj kolejny
                </Button>
              </div>

              {details.map((detail, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg relative"
                >
                  <div className="flex flex-col items-center justify-start pt-2 px-1">
                    <input
                      type="radio"
                      name="primaryContactEdit"
                      checked={detail.isPrimary}
                      onChange={() => handleSetPrimary(index)}
                      className="w-4 h-4 text-[#004a8f] focus:ring-[#004a8f] cursor-pointer"
                      title="Ustaw jako główny kontakt"
                    />
                    <span className="text-[10px] text-gray-500 mt-1">Główny</span>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Typ *</label>
                      <select
                        value={detail.type}
                        onChange={(e) => handleDetailChange(index, 'type', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f] bg-white"
                        required
                      >
                        <option value="" disabled>
                          Wybierz...
                        </option>
                        {contactTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Etykieta *</label>
                      <input
                        value={detail.label}
                        onChange={(e) => handleDetailChange(index, 'label', e.target.value)}
                        placeholder="np. Służbowy"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Wartość *</label>
                      <input
                        value={detail.value}
                        onChange={(e) => handleDetailChange(index, 'value', e.target.value)}
                        placeholder="Email / Telefon"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                        required
                      />
                    </div>
                  </div>

                  {details.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDetail(index)}
                      className="mt-5 text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 shrink-0"
                      title="Usuń szczegół"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {details.length === 0 && (
                <p className="text-sm text-red-500 text-center py-2">
                  Musisz zachować co najmniej jeden detal kontaktowy.
                </p>
              )}
            </div>

            <DialogFooter className="pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={isLoading}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isLoading || details.length === 0}
                className="bg-[#004a8f] text-white hover:bg-blue-800"
              >
                {isLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
