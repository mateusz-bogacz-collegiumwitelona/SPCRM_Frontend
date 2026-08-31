import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { AuthGuard } from '~/lib/auth-guard';
import { MainLayout } from '~/components/layout/main-layout';
import React from 'react';
import { OfferDetailHeader } from '~/components/offer/offer-detail-header';
import { OfferClientDetail } from '~/components/offer/offer-contact-detail';
import { OfferProductsTable } from '~/components/offer/offer-product-table';

const OfferDetail: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();

  const {
    data: basicInfo,
    isLoading: isBasicInfoLoading,
    isError,
  } = useQuery({
    queryKey: ['offer-detail', offerId],
    queryFn: async () => (await api.get(`offer/detail/${offerId}`)).data.data,
    enabled: !!offerId,
  });

  return (
    <AuthGuard>
      <MainLayout>
        <div className="bg-white lg:bg-[#f8f9fa] w-full min-h-screen pb-12">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
            <OfferDetailHeader
              isLoading={isBasicInfoLoading}
              isError={isError}
              basicInfo={basicInfo}
            />
            {offerId && <OfferClientDetail offerId={offerId} />} {}
            {offerId && <OfferProductsTable offerId={offerId} />}
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default OfferDetail;
