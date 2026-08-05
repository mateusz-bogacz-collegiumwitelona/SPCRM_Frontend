import React from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { MainLayout } from '~/components/layout/main-layout';
import { RoleGuard } from '~/lib/role-guard';
import { AlertCircle, Box, Scale, Banknote, Loader2, ArrowLeft } from 'lucide-react';
import { AuthGuard } from '~/lib/auth-guard';

interface ActivePromotionResponse {
  name: string;
  discountPercentage?: number;
  promotionalPrice?: number;
  endDate?: string;
  minQuantity?: number;
}

interface ProductDetailResponse {
  id: string;
  name: string;
  steelGrade: string;
  category: string;
  dimensions: string;
  stockQuantity: number;
  reservedQuantity: number;
  unitSymbol: string;
  pricePerUnit: number;
  weight: number;
  activePromotion?: ActivePromotionResponse;
}

const ProductHeader = ({
  isLoading,
  isError,
  product,
}: {
  isLoading: boolean;
  isError: boolean;
  product?: ProductDetailResponse;
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6 flex items-center gap-4">
        <Loader2 className="animate-spin text-blue-900 w-6 h-6" />
        <span className="text-gray-500 font-medium">Ładowanie nagłówka produktu...</span>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200 mb-6 flex items-center gap-2 text-red-700">
        <AlertCircle className="w-6 h-6" />
        <span className="font-medium">Nie udało się załadować danych produktu.</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6 relative overflow-hidden">
      {product.activePromotion && (
        <div className="absolute top-4 -right-8 bg-red-600 text-white text-xs font-bold px-10 py-1 rotate-45 shadow-md">
          PROMOCJA
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/products" className="text-gray-500 hover:text-blue-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              {product.category}
            </span>
            {product.activePromotion && (
              <span className="bg-red-100 text-red-700 border border-red-200 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
                {product.activePromotion.name}
              </span>
            )}
          </div>
          <p className="text-gray-500 ml-8">
            Gatunek: <span className="font-medium text-gray-900">{product.steelGrade}</span> |
            Wymiary: <span className="font-medium text-gray-900">{product.dimensions}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const ProductLogisticsInfo = ({ product }: { product: ProductDetailResponse }) => {
  const availableQuantity = product.stockQuantity - product.reservedQuantity;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-full">
      <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
        <Box className="w-5 h-5 text-gray-500" /> Stany magazynowe
      </h2>

      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">Dostępne do sprzedaży</p>
          <p className="text-3xl font-bold text-green-600">
            {availableQuantity}{' '}
            <span className="text-lg font-medium text-gray-500">{product.unitSymbol}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Stan fizyczny (Magazyn)</p>
            <p className="text-lg font-semibold text-gray-900">
              {product.stockQuantity} {product.unitSymbol}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Zarezerwowane (Deals)</p>
            <p className="text-lg font-semibold text-orange-600">
              {product.reservedQuantity} {product.unitSymbol}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductPricingInfo = ({ product }: { product: ProductDetailResponse }) => {
  const promo = product.activePromotion;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Cennik i Logistyka</h2>

      <div className="space-y-4">
        <div
          className={`flex items-center gap-4 p-4 rounded-md border ${promo ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}
        >
          <Banknote className={`w-6 h-6 shrink-0 ${promo ? 'text-red-600' : 'text-blue-900'}`} />

          <div className="w-full">
            <div className="flex justify-between items-start">
              <p className="text-xs text-gray-500">Cena za 1 {product.unitSymbol}</p>
              {promo?.discountPercentage && (
                <span className="text-xs font-bold text-white bg-red-500 px-2 rounded-full">
                  -{promo.discountPercentage}%
                </span>
              )}
            </div>

            {promo ? (
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-red-700">
                  {promo.promotionalPrice
                    ? promo.promotionalPrice.toLocaleString('pl-PL', {
                        style: 'currency',
                        currency: 'PLN',
                      })
                    : (
                        product.pricePerUnit *
                        (1 - (promo.discountPercentage || 0) / 100)
                      ).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                </span>
                <span className="text-sm font-medium text-gray-400 line-through">
                  {product.pricePerUnit.toLocaleString('pl-PL', {
                    style: 'currency',
                    currency: 'PLN',
                  })}
                </span>
              </div>
            ) : (
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {product.pricePerUnit.toLocaleString('pl-PL', {
                  style: 'currency',
                  currency: 'PLN',
                })}
              </p>
            )}
          </div>
        </div>

        {promo && (promo.endDate || promo.minQuantity) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-xs text-yellow-800 space-y-1">
            {promo.endDate && (
              <p>
                Ważna do: <strong>{formatDate(promo.endDate)}</strong>
              </p>
            )}
            {promo.minQuantity && (
              <p>
                Minimalna ilość zamówienia:{' '}
                <strong>
                  {promo.minQuantity} {product.unitSymbol}
                </strong>
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-md border border-gray-100">
          <Scale className="w-6 h-6 text-blue-900 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Waga dla 1 {product.unitSymbol}</p>
            <p className="text-sm font-semibold text-gray-900">{product.weight} kg</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProductDetails() {
  const { productId } = useParams<{ productId: string }>();

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product-details', productId],
    queryFn: async () => {
      const response = await api.get(`/products/${productId}`);
      return response.data?.value || response.data?.data || response.data;
    },
    enabled: !!productId,
  });

  if (!productId) return null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="bg-white lg:bg-[#f8f9fa] w-full min-h-screen pb-12">
            <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
              <ProductHeader isLoading={isLoading} isError={isError} product={product} />

              {product && (
                <>
                  <div className="block lg:hidden space-y-6">
                    <ProductLogisticsInfo product={product} />
                    <ProductPricingInfo product={product} />
                  </div>

                  <div className="hidden lg:flex flex-row gap-8 items-start relative">
                    <div className="flex-1 min-w-0">
                      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm min-h-100 flex items-center justify-center text-gray-400 border-dashed">
                        Tutaj w przyszłości pojawi się tabela &#34;Otwarte szanse sprzedaży
                        (Deals)&#34; lub &#34;Historia dostaw&#34; powiązana z tym produktem.
                      </div>
                    </div>

                    <div className="w-100 xl:w-112.5 shrink-0 sticky top-24">
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
