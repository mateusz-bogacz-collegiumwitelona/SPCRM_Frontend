import React from 'react';
import { Calendar, Layers, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { PromotionDetailResponse } from '~/interfaces/promotion';

export const PromotionTermsCard: React.FC<{ readonly promotion: PromotionDetailResponse }> = ({
  promotion,
}) => {
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
                {typeof promotion.minQuantity === 'number'
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
                {typeof promotion.minWeight === 'number'
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
