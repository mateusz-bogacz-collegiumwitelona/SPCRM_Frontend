import type { CurrencySimple } from '~/types/currency';
import { Edit2 } from 'lucide-react';

export const CurrencyMobileCard = ({
  currency,
  onEdit,
}: {
  readonly currency: CurrencySimple;
  readonly onEdit: (currency: {
    id: string;
    name: string;
    code: string;
    decimalPlace: number;
  }) => void;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-xs">
          {currency.code}
        </span>
        <p className="text-sm font-semibold text-gray-900">{currency.name}</p>
      </div>
      <button
        type="button"
        onClick={() =>
          onEdit({
            id: currency.currencyId,
            name: currency.name,
            code: currency.code,
            decimalPlace: currency.decimalPlace,
          })
        }
        className="text-xs font-medium text-blue-900 hover:underline flex items-center gap-1"
      >
        <Edit2 className="w-3.5 h-3.5" /> Edytuj
      </button>
    </div>
    <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 mt-2">
      Miejsca po przecinku:{' '}
      <span className="font-medium text-gray-700">{currency.decimalPlace}</span>
    </div>
  </div>
);
