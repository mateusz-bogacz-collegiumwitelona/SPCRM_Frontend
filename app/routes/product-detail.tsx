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
import { ProductLogisticsInfo } from '~/components/products/product-logistics';
import { ProductPricingInfo } from '~/components/products/product-pricing';
import { ProductDeals } from '~/components/products/product-deals';
import { ProductInvoices } from '~/components/products/product-invoices';
import { ProductHeader } from '~/components/products/product-header';

export default function ProductDetails() {
  const { productId } = useParams<{ productId: string }>();

  const {
    data: product,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['product-details', productId],
    queryFn: async () => {
      const response = await api.get(`/products/${productId}`);
      return response.data?.value || response.data?.data || response.data;
    },
    enabled: Boolean(productId),
    retry: false,
  });
  if (!productId || isNotFoundError(queryError)) {
    return <NotFound />;
  }

  if (isLoading) {
    return <PageLoader message="Wczytywanie szczegółów produktu..." />;
  }

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={STANDARD_ROLES}>
        <MainLayout>
          <div className="bg-white lg:bg-[#f8f9fa] w-full min-h-screen pb-12">
            <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
              {product && (
                <>
                  <ProductHeader product={product} />

                  <div className="block xl:hidden space-y-6 w-full min-w-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ProductLogisticsInfo product={product} />
                      <div className="md:mt-0">
                        <ProductPricingInfo product={product} />
                      </div>
                    </div>

                    <div className="w-full min-w-0 space-y-6 overflow-hidden">
                      <ProductDeals productId={product.id} unitSymbol={product.unitSymbol} />
                      <ProductInvoices productId={product.id} unitSymbol={product.unitSymbol} />
                    </div>
                  </div>
                  <div className="hidden xl:flex flex-row gap-8 items-start w-full min-w-0">
                    <div className="flex-1 min-w-0 overflow-hidden space-y-6">
                      <ProductDeals productId={product.id} unitSymbol={product.unitSymbol} />
                      <ProductInvoices productId={product.id} unitSymbol={product.unitSymbol} />
                    </div>

                    <div className="w-96 xl:w-104 shrink-0 sticky top-24">
                      <ProductLogisticsInfo product={product} />
                      <ProductPricingInfo product={product} />
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
