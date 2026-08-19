import React from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { MainLayout } from '~/components/layout/main-layout';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Layers,
  Loader2,
  Package,
  Scale,
  Sparkles,
  Tag,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { formatCurrency } from '~/utils/currency-formatter';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/apiError';

interface PromotionDetailResponse {
  id: string;
  name: string;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  discountPercentage?: number | null;
  promotionalPrice?: number | null;
  currencyCode?: string | null;
  currencyDecimalPlaces?: number | null;
  minQuantity?: number | null;
  minWeight?: number | null;
  productId: string;
  productName: string;
  steelGrade: string;
  category: string;
  dimensions: string;
  productPricePerUnit: number;
  productStockQuantity: number;
  unitSymbol: string;
  contactId?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactCompanyName?: string | null;
  createdAt: string;
  updateAt?: string | null;
}

const PromotionHeader: React.FC<{
  promotion?: PromotionDetailResponse;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}> = ({ promotion, isLoading, isError, errorMessage }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6 flex items-center gap-4">
        <Loader2 className="animate-spin text-blue-900 w-6 h-6" />
        <span className="text-gray-500 font-medium">Ładowanie nagłówka promocji...</span>
      </div>
    );
  }

  if (isError || !promotion) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200 mb-6 flex items-center gap-2 text-red-700">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <span className="font-medium">
          {errorMessage || 'Nie udało się załadować danych promocji.'}
        </span>
      </div>
    );
  }

  const isExpired = promotion.endDate && new Date(promotion.endDate) < new Date();

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <Link
              to="/promotions"
              className="text-gray-500 hover:text-blue-900 transition-colors"
              title="Powrót do listy promocji"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">{promotion.name}</h1>

            {promotion.isActive && !isExpired ? (
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Aktywna
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {isExpired ? 'Wygasła' : 'Zakończona'}
              </span>
            )}

            {promotion.discountPercentage != null && (
              <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                -{promotion.discountPercentage}%
              </span>
            )}
          </div>

          <p className="text-gray-500 ml-8 text-sm">
            Utworzono:{' '}
            <span className="font-medium text-gray-900">
              {format(new Date(promotion.createdAt), 'dd MMMM yyyy, HH:mm', { locale: pl })}
            </span>
            {promotion.updateAt && (
              <>
                {' '}
                | Ostatnia zmiana:{' '}
                <span className="font-medium text-gray-900">
                  {format(new Date(promotion.updateAt), 'dd MMMM yyyy, HH:mm', { locale: pl })}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

const PromotionPricingCard: React.FC<{ promotion: PromotionDetailResponse }> = ({ promotion }) => {
  const basePriceFormatted = formatCurrency(promotion.productPricePerUnit, 2);
  let finalPriceFormatted = basePriceFormatted;
  let savingsFormatted: string | null = null;

  if (promotion.promotionalPrice != null) {
    finalPriceFormatted = formatCurrency(
      promotion.promotionalPrice,
      promotion.currencyDecimalPlaces ?? 2,
    );
    const savings = promotion.productPricePerUnit - promotion.promotionalPrice;
    if (savings > 0) {
      savingsFormatted = formatCurrency(savings, promotion.currencyDecimalPlaces ?? 2);
    }
  } else if (promotion.discountPercentage != null) {
    const discountedPrice =
      promotion.productPricePerUnit * (1 - promotion.discountPercentage / 100);
    finalPriceFormatted = formatCurrency(discountedPrice, 2);
    const savings = promotion.productPricePerUnit - discountedPrice;
    savingsFormatted = formatCurrency(savings, 2);
  }

  const currencyCode = promotion.currencyCode || 'PLN';

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-full">
      <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-900" /> Warunki cenowe
      </h2>

      <div className="space-y-6">
        <div>
          <p className="text-xs text-gray-500 mb-1">
            Cena po rabacie (za 1 {promotion.unitSymbol})
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-red-600">
              {finalPriceFormatted} {currencyCode}
            </span>
            <span className="text-sm text-gray-400 line-through">
              {basePriceFormatted} {currencyCode}
            </span>
          </div>
          {savingsFormatted && (
            <p className="text-xs font-semibold text-green-700 mt-1">
              Oszczędność: {savingsFormatted} {currencyCode} / {promotion.unitSymbol}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Typ rabatu</p>
            <p className="text-sm font-semibold text-gray-900">
              {promotion.discountPercentage != null
                ? `Procentowy (-${promotion.discountPercentage}%)`
                : promotion.promotionalPrice != null
                  ? 'Sztywna cena jednostkowa'
                  : 'Brak danych'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Cena katalogowa</p>
            <p className="text-sm font-semibold text-gray-700">
              {basePriceFormatted} {currencyCode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PromotionTermsCard: React.FC<{ promotion: PromotionDetailResponse }> = ({ promotion }) => {
  const startDateFormatted = promotion.startDate
    ? format(new Date(promotion.startDate), 'dd MMMM yyyy', { locale: pl })
    : 'Od momentu utworzenia';

  const endDateFormatted = promotion.endDate
    ? format(new Date(promotion.endDate), 'dd MMMM yyyy', { locale: pl })
    : 'Do odwołania (bezterminowo)';

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-500" /> Okres i limity zamówienia
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Data rozpoczęcia</p>
            <p className="text-sm font-semibold text-gray-900">{startDateFormatted}</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Data zakończenia</p>
            <p className="text-sm font-semibold text-gray-900">{endDateFormatted}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-100">
            <Layers className="w-5 h-5 text-blue-900 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Minimalny wolumen</p>
              <p className="text-sm font-semibold text-gray-900">
                {promotion.minQuantity != null
                  ? `${promotion.minQuantity} ${promotion.unitSymbol}`
                  : 'Brak limitu ilościowego'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-100">
            <Scale className="w-5 h-5 text-blue-900 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Minimalna waga</p>
              <p className="text-sm font-semibold text-gray-900">
                {promotion.minWeight != null
                  ? `${(promotion.minWeight / 1000).toLocaleString('pl-PL')} kg`
                  : 'Brak limitu wagowego'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PromotionProductSidebar: React.FC<{ promotion: PromotionDetailResponse }> = ({
  promotion,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-900" /> Objęty produkt
        </h2>
        <Link
          to={`/products/${promotion.productId}`}
          className="text-xs text-blue-900 hover:underline font-medium"
        >
          Karta produktu &rarr;
        </Link>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Nazwa produktu</p>
          <p className="font-semibold text-gray-900">{promotion.productName}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Kategoria</p>
            <span className="bg-blue-50 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
              {promotion.category}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Gatunek stali</p>
            <p className="font-semibold text-gray-900">{promotion.steelGrade}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-0.5">Wymiary</p>
          <p className="font-medium text-gray-700">{promotion.dimensions || 'Brak danych'}</p>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-0.5">Dostępność na magazynie</p>
          <p className="text-base font-bold text-green-700">
            {promotion.productStockQuantity} {promotion.unitSymbol}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <User className="w-4 h-4" /> Przypisanie klienta
        </h3>

        {promotion.contactId ? (
          <div className="p-3 bg-blue-50/50 rounded-md border border-blue-100">
            <p className="text-sm font-semibold text-blue-900">
              {promotion.contactFirstName} {promotion.contactLastName}
            </p>
            {promotion.contactCompanyName && (
              <p className="text-xs text-gray-600 mt-0.5">{promotion.contactCompanyName}</p>
            )}
            <Link
              to={`/contact/${promotion.contactId}`}
              className="inline-block mt-2 text-xs text-blue-800 underline font-medium"
            >
              Zobacz profil klienta
            </Link>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-md border border-gray-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-600">
              Promocja ogólna (dla wszystkich klientów)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PromotionDetails() {
  const { promotionId } = useParams<{ promotionId: string }>();

  const {
    data: promotion,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<PromotionDetailResponse>({
    queryKey: ['promotion-details', promotionId],
    queryFn: async () => {
      const response = await api.get(`/promotion/${promotionId}`);
      return response.data?.data || response.data?.value || response.data;
    },
    enabled: !!promotionId,
  });

  const errorMessage = isError
    ? getErrorMessage(
        (queryError as ApiError)?.response?.data?.errorCode,
        'Nie udało się pobrać szczegółów promocji.',
      )
    : undefined;

  if (!promotionId) return null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="bg-white lg:bg-[#f8f9fa] w-full min-h-screen pb-12">
            <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
              <PromotionHeader
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                promotion={promotion}
              />

              {promotion && (
                <>
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
