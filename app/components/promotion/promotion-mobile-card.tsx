import type { PromotionResponse } from '~/types/promotion';
import { format } from 'date-fns';
import { formatCurrency } from '~/utils/data-formatters';

const formatDiscountOrPrice = (promo: PromotionResponse): React.ReactNode => {
  if (typeof promo.discountPercentage === 'number') {
    return <span className="text-red-600">-{promo.discountPercentage}%</span>;
  }
  if (typeof promo.promotionalPrice === 'number') {
    return formatCurrency(
      promo.promotionalPrice,
      promo.promotionalPriceCode || 'PLN',
      promo.promotionalPriceDecimalPlace ?? 2,
    );
  }
  return '-';
};

export const PromotionMobileCard = ({ promo }: { readonly promo: PromotionResponse }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-2 flex justify-between items-start">
      <div>
        <p className="text-sm font-bold text-blue-900">{promo.name}</p>
      </div>
      {promo.isActive ? (
        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
          Aktywna
        </span>
      ) : (
        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
          Zakończona
        </span>
      )}
    </div>
    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
      <div className="text-gray-700 font-medium">{formatDiscountOrPrice(promo)}</div>
      <div className="text-xs text-gray-500">
        {promo.startDate ? format(new Date(promo.startDate), 'dd.MM.yyyy') : 'Od zawsze'}
        {' - '}
        {promo.endDate ? format(new Date(promo.endDate), 'dd.MM.yyyy') : 'Bezterminowo'}
      </div>
    </div>
  </div>
);
