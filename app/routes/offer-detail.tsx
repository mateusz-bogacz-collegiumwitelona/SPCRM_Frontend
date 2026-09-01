import { useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import { AuthGuard } from '~/lib/auth-guard';
import { MainLayout } from '~/components/layout/main-layout';
import React, { useState } from 'react';
import { OfferDetailHeader } from '~/components/offer/offer-detail-header';
import { OfferClientDetail } from '~/components/offer/offer-contact-detail';
import { OfferProductsTable } from '~/components/offer/offer-product-table';
import { ExtendOfferValidityDialog } from '~/components/offer/extend-offer-validity-dialog';
import { ChangeOfferStatusDialog } from '~/components/offer/change-offer-status-dialog';
import { Button } from '~/components/ui/button';
import { CalendarClock, CheckCircle, XCircle } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/api-error';

interface OfferAllowedActionsResponse {
  canEdit: boolean;
  canDelete: boolean;
  canResendEmail: boolean;
  canExtendValidity: boolean;
  allowedStatusTransitions: string[];
}

const OfferDetail: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const queryClient = useQueryClient();

  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [statusDialogState, setStatusDialogState] = useState<{
    isOpen: boolean;
    targetStatus: 'Accepted' | 'Rejected' | null;
  }>({
    isOpen: false,
    targetStatus: null,
  });

  const {
    data: basicInfo,
    isLoading: isBasicInfoLoading,
    isError,
  } = useQuery({
    queryKey: ['offer-detail', offerId],
    queryFn: async () => (await api.get(`offer/detail/${offerId}`)).data.data,
    enabled: Boolean(offerId),
  });

  const { data: allowedActions } = useQuery<OfferAllowedActionsResponse>({
    queryKey: ['offer-allowed-actions', offerId],
    queryFn: async () => {
      const res = await api.get(`/offer/${offerId}/allowed-actions`);
      return res.data?.data || res.data?.value || res.data;
    },
    enabled: Boolean(offerId),
  });

  const extendValidityMutation = useMutation({
    mutationFn: async (newDate?: Date) => {
      await api.patch('/offer/extend', {
        offerId,
        newValidUntil: newDate ? newDate.toISOString() : undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['offer-detail', offerId] });
      await queryClient.invalidateQueries({ queryKey: ['offer-allowed-actions', offerId] });
      await queryClient.invalidateQueries({ queryKey: ['offers-list'] });
      setIsExtendModalOpen(false);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      alert(
        getErrorMessage(
          apiError.response?.data?.errorCode,
          'Wystąpił błąd podczas przedłużania ważności oferty.',
        ),
      );
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: async (newStatus: 'Accepted' | 'Rejected') => {
      await api.patch('/offer/change-status', {
        offerId,
        newStatus,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['offer-detail', offerId] });
      await queryClient.invalidateQueries({ queryKey: ['offer-allowed-actions', offerId] });
      await queryClient.invalidateQueries({ queryKey: ['offers-list'] });
      setStatusDialogState({ isOpen: false, targetStatus: null });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      alert(
        getErrorMessage(
          apiError.response?.data?.errorCode,
          'Wystąpił błąd podczas zmiany statusu oferty.',
        ),
      );
    },
  });

  const canAccept = allowedActions?.allowedStatusTransitions?.includes('Accepted');
  const canReject = allowedActions?.allowedStatusTransitions?.includes('Rejected');
  const canExtend = allowedActions?.canExtendValidity;

  return (
    <AuthGuard>
      <MainLayout>
        <div className="bg-white lg:bg-[#f8f9fa] w-full min-h-screen pb-12">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col gap-4">
              <OfferDetailHeader
                isLoading={isBasicInfoLoading}
                isError={isError}
                basicInfo={basicInfo}
              />

              <div className="flex flex-wrap items-center justify-end gap-2.5">
                {canReject && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStatusDialogState({ isOpen: true, targetStatus: 'Rejected' })}
                    className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Odrzuć ofertę
                  </Button>
                )}

                {canAccept && (
                  <Button
                    type="button"
                    onClick={() => setStatusDialogState({ isOpen: true, targetStatus: 'Accepted' })}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Zaakceptuj ofertę
                  </Button>
                )}

                {canExtend && (
                  <Button
                    type="button"
                    onClick={() => setIsExtendModalOpen(true)}
                    className="bg-[#004a8f] text-white hover:bg-[#003870] flex items-center gap-2 font-medium text-xs sm:text-sm"
                  >
                    <CalendarClock className="w-4 h-4" />
                    Przedłuż ważność
                  </Button>
                )}
              </div>
            </div>

            {offerId && <OfferClientDetail offerId={offerId} />}
            {offerId && <OfferProductsTable offerId={offerId} />}
          </div>
        </div>

        <ExtendOfferValidityDialog
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          onConfirm={async (newDate) => {
            await extendValidityMutation.mutateAsync(newDate);
          }}
          isLoading={extendValidityMutation.isPending}
          offerName={basicInfo?.offerName}
          currentValidUntil={basicInfo?.validUntil}
        />

        <ChangeOfferStatusDialog
          isOpen={statusDialogState.isOpen}
          targetStatus={statusDialogState.targetStatus}
          onClose={() => setStatusDialogState({ isOpen: false, targetStatus: null })}
          onConfirm={async (status) => {
            await changeStatusMutation.mutateAsync(status);
          }}
          isLoading={changeStatusMutation.isPending}
          offerName={basicInfo?.offerName}
        />
      </MainLayout>
    </AuthGuard>
  );
};

export default OfferDetail;
