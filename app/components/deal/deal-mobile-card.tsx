import { getStatusConfig } from '~/constants/sale-status';
import { formatCurrency, formatDate } from '~/utils/data-formatters';
import { Link } from 'react-router';
import type { UserSalesResponse } from '~/types/deal';

interface SaleMobileCardProps {
  readonly item: UserSalesResponse;
  readonly isManager: boolean;
}

export const SaleMobileCard = ({ item, isManager }: SaleMobileCardProps) => {
  const status = getStatusConfig(item.status);
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-blue-900 truncate">{item.companyName}</p>
          <p className="text-xs text-gray-500 mb-1">NIP: {item.nip}</p>
          {isManager && item.ownerFirstName && (
            <p className="text-xs text-gray-600 mb-1 font-medium">
              Opiekun: {item.ownerFirstName} {item.ownerLastName}
            </p>
          )}
          <p className="text-sm font-medium text-gray-700">
            {formatCurrency(item.value, item.currency, item.decimalPlace)}
          </p>
        </div>
        <span
          className={`flex shrink-0 items-center justify-center rounded-full ${status.bgColor} px-3 py-1 text-xs font-medium ${status.textColor}`}
        >
          {status.label}
        </span>
      </div>
      <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
        <p className="text-xs text-gray-500">Zakończenie: {formatDate(item.closeDate)}</p>
        <p className="text-xs font-medium text-gray-900 truncate max-w-30">{item.name}</p>
        <Link to={`/sale/${item.id}`} className="text-sm font-medium text-blue-900 hover:underline">
          Szczegóły
        </Link>
      </div>
    </div>
  );
};
