import { getStatusConfig } from '~/constants/sale-status';
import type { ProductDealItemResponse } from '~/types/product';
import { Link } from 'react-router';
import { Building2 } from 'lucide-react';
import { formatCurrency } from '~/utils/data-formatters';
import { Calendar } from '~/components/ui/calendar';
import { format } from 'date-fns';

export const ProductDealMobileCard = ({
  item,
  unitSymbol,
}: {
  readonly item: ProductDealItemResponse;
  readonly unitSymbol: string;
}) => {
  const statusCfg = getStatusConfig(item.status);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm relative">
      <div className="flex justify-between items-start gap-2 mb-2">
        <div>
          <Link
            to={`/sale/${item.dealId}`}
            className="text-sm font-bold text-blue-900 hover:underline"
          >
            {item.dealName}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            <span>{item.companyName}</span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bgColor} ${statusCfg.textColor}`}
        >
          {statusCfg.label}
        </span>
      </div>

      <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
        <div className="text-gray-600 text-xs">
          Ilość:{' '}
          <span className="font-semibold text-gray-900">
            {item.quantity} {unitSymbol}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">
            {formatCurrency(item.unitPrice, item.currencyCode, item.decimalPlaces)} / {unitSymbol}
          </p>
          <p className="font-bold text-gray-900 text-sm">
            {formatCurrency(item.totalPrice, item.currencyCode, item.decimalPlaces)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-2 pt-1.5 border-t border-gray-100">
        <Calendar className="w-3 h-3 text-gray-400" />
        <span>Termin: {format(new Date(item.closeDate), 'dd.MM.yyyy')}</span>
      </div>
    </div>
  );
};
