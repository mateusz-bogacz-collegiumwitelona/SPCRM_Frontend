import React from 'react';
import { Sparkles } from 'lucide-react';
import { formatCurrency } from '~/utils/data-formatters';
import type { PromotionDetailResponse } from '~/interfaces/promotion';

const getDiscountTypeLabel = (promotion: PromotionDetailResponse): string => {
  if (typeof promotion.discountPercentage === 'number') {
    return `Procentowy (-${promotion.discountPercentage}%)`;
  }
  if (typeof promotion.promotionalPrice === 'number') {
    return 'Sztywna cena jednostkowa';
  }
  return 'Brak danych';
};

export const PromotionPricingCard: React.FC<{ readonly promotion: PromotionDetailResponse }> = ({
  promotion,
}) => {
  const currencyCode = promotion.currencyCode || 'PLN';
  const decimals = promotion.currencyDecimalPlaces ?? 2;

  const basePriceFormatted = formatCurrency(promotion.productPricePerUnit, currencyCode, decimals);
  let finalPriceFormatted = basePriceFormatted;
  let savingsFormatted: string | null = null;

  if (typeof promotion.promotionalPrice === 'number') {
    finalPriceFormatted = formatCurrency(promotion.promotionalPrice, currencyCode, decimals);
    const savings = promotion.productPricePerUnit - promotion.promotionalPrice;
    if (savings > 0) savingsFormatted = formatCurrency(savings, currencyCode, decimals);
  } else if (typeof promotion.discountPercentage === 'number') {
    const discountedPrice =
      promotion.productPricePerUnit * (1 - promotion.discountPercentage / 100);
    finalPriceFormatted = formatCurrency(discountedPrice, currencyCode, decimals);
    const savings = promotion.productPricePerUnit - discountedPrice;
    savingsFormatted = formatCurrency(savings, currencyCode, decimals);
  }

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
            <span className="text-3xl font-bold text-red-600">{finalPriceFormatted}</span>
            <span className="text-sm text-gray-400 line-through">{basePriceFormatted}</span>
          </div>
          {savingsFormatted && (
            <p className="text-xs font-semibold text-green-700 mt-1">
              Oszczędność: {savingsFormatted} / {promotion.unitSymbol}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Typ rabatu</p>
            <p className="text-sm font-semibold text-gray-900">{getDiscountTypeLabel(promotion)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Cena katalogowa</p>
            <p className="text-sm font-semibold text-gray-700">{basePriceFormatted}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
