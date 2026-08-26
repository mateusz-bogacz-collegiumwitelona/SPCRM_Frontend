import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api } from '~/api/api';
import { Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '~/context/auth-context';
import { DeleteContactDialog } from './delete-contact-dialog';
import { Button } from '~/components/ui/button';
import type ApiError from '~/interfaces/apiError';
import { getErrorMessage } from '~/utils/error-mapper';

interface ContactBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  companyName: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  isPrimary: boolean;
}

export const ContactHeader: React.FC<{ contactId: string }> = ({ contactId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { user } = useAuth();
  const canDelete = user?.roles.some((role) => ['Manager', 'Admin'].includes(role));

  const {
    data: info,
    isLoading,
    isError,
  } = useQuery<ContactBasicInfo>({
    queryKey: ['contact-details', contactId],
    queryFn: async () => {
      const res = await api.get(`/contacts/${contactId}`);
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['company-contacts'] });
      navigate('/contacts');
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback = 'Wystąpił błąd podczas usuwania kontaktu.';
      alert(getErrorMessage(code, fallback));
      setIsDeleteDialogOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[#004a8f] mb-6 lg:mb-8">
        <Loader2 className="animate-spin w-6 h-6" />
        <span className="text-sm font-medium">Ładowanie danych kontaktu...</span>
      </div>
    );
  }

  if (isError || !info) {
    return (
      <div className="text-red-500 font-medium mb-6 lg:mb-8">Błąd ładowania danych kontaktu.</div>
    );
  }

  return (
    <>
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-normal text-gray-900 leading-tight">
                {info.firstName} {info.lastName}
              </h1>

              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:bg-red-50 hover:text-red-700 h-8 w-8"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  title="Usuń kontakt"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>

            <p className="text-lg text-gray-900 mt-1.5">{info.companyName}</p>
            {info.jobTitle && (
              <p className="text-sm font-medium text-[#004a8f] mt-0.5">{info.jobTitle}</p>
            )}
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2 mt-2 lg:mt-0">
            <div
              className={`inline-block px-3 py-1 rounded-full ${
                info.isPrimary ? 'bg-[#d4edda] text-[#28a745]' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className="font-medium text-sm">
                {info.isPrimary ? 'Główny kontakt' : 'Kontakt dodatkowy'}
              </span>
            </div>

            {(info.ownerFirstName || info.ownerLastName) && (
              <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                Opiekun:{' '}
                <span className="font-medium text-gray-700">
                  {info.ownerFirstName} {info.ownerLastName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteContactDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
