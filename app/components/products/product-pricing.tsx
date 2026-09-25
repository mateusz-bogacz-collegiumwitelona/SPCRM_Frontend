import type { ProductDetailResponse } from '~/interfaces/product';
import { Banknote, Scale } from 'lucide-react';
import { formatCurrency, formatWeight } from '~/utils/data-formatters';

export const ProductPricingInfo = ({ product }: { product: ProductDetailResponse }) => {
  const promo = product.activePromotion;
  const currency = product.currencyCode || 'PLN';
  const decimals = product.decimalPlaces ?? 2;

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
                    ? formatCurrency(promo.promotionalPrice, currency, decimals)
                    : formatCurrency(
                        product.pricePerUnit * (1 - (promo.discountPercentage || 0) / 100),
                        currency,
                        decimals,
                      )}
                </span>
                <span className="text-sm font-medium text-gray-400 line-through">
                  {formatCurrency(product.pricePerUnit, currency, decimals)}
                </span>
              </div>
            ) : (
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {formatCurrency(product.pricePerUnit, currency, decimals)}
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
            <p className="text-sm font-semibold text-gray-900">{formatWeight(product.weight)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
