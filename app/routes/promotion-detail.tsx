import React from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api, isNotFoundError } from '~/api/api';
import { MainLayout } from '~/components/layout/main-layout';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { STANDARD_ROLES } from '~/constants/roles';
import NotFound from '~/routes/not-found';
import { PageLoader } from '~/components/layout/page-loader';
import type { PromotionDetailResponse } from '~/interfaces/promotion';
import { PromotionHeader } from '~/components/promotion/promotion-header';
import { PromotionPricingCard } from '~/components/promotion/promotion-pricing-card';
import { PromotionTermsCard } from '~/components/promotion/promotion-terms-card';
import { PromotionProductSidebar } from '~/components/promotion/promotion-product-sidebar';

export default function PromotionDetails() {
  const { promotionId } = useParams<{ promotionId: string }>();

  const {
    data: promotion,
    isLoading,
    error: queryError,
  } = useQuery<PromotionDetailResponse>({
    queryKey: ['promotion-details', promotionId],
    queryFn: async () => {
      const response = await api.get(`/promotion/${promotionId}`);
      return response.data?.data || response.data?.value || response.data;
    },
    enabled: Boolean(promotionId),
    retry: false,
  });

  if (!promotionId || isNotFoundError(queryError)) {
    return <NotFound />;
  }

  if (isLoading) {
    return <PageLoader message="Wczytywanie szczegółów promocji..." />;
  }
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={STANDARD_ROLES}>
        <MainLayout>
          <div className="bg-white lg:bg-[#f8f9fa] w-full min-h-screen pb-12">
            <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
              {promotion && (
                <>
                  <PromotionHeader promotion={promotion} />

                  <div className="block lg:hidden space-y-6">
                    <PromotionPricingCard promotion={promotion} />
                    <PromotionTermsCard promotion={promotion} />
                    <PromotionProductSidebar promotion={promotion} />
                  </div>

                  <div className="hidden lg:flex flex-row gap-8 items-start relative">
                    <div className="flex-1 min-w-0 space-y-6">
                      <PromotionPricingCard promotion={promotion} />
                      <PromotionTermsCard promotion={promotion} />
                    </div>

                    <div className="w-100 xl:w-112.5 shrink-0 sticky top-24">
                      <PromotionProductSidebar promotion={promotion} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
