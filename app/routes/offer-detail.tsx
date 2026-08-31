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
import { Button } from '~/components/ui/button';
import { CalendarClock } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/api-error';

const OfferDetail: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const queryClient = useQueryClient();
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);

  const {
    data: basicInfo,
    isLoading: isBasicInfoLoading,
    isError,
  } = useQuery({
    queryKey: ['offer-detail', offerId],
    queryFn: async () => (await api.get(`offer/detail/${offerId}`)).data.data,
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

  const canExtend = basicInfo && basicInfo.status !== 'Accepted' && basicInfo.status !== 'Rejected';

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

              {canExtend && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setIsExtendModalOpen(true)}
                    className="bg-[#004a8f] text-white hover:bg-[#003870] flex items-center gap-2 font-medium text-xs sm:text-sm"
                  >
                    <CalendarClock className="w-4 h-4" />
                    Przedłuż ważność oferty
                  </Button>
                </div>
              )}
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
      </MainLayout>
    </AuthGuard>
  );
};

export default OfferDetail;
