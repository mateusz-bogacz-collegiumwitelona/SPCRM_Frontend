import type { GetCompanyResponse } from '~/types/company';
import { Link } from 'react-router';
import { formatDate } from '~/utils/data-formatters';

export const CompanyMobileCard = ({ item }: { readonly item: GetCompanyResponse }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-start justify-between gap-2">
      <div className="overflow-hidden">
        <p className="text-sm font-bold text-blue-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-500 mb-1">NIP: {item.nip}</p>
        <p className="text-sm text-gray-700">
          {item.city}, {item.street}
        </p>
      </div>
      {item.isYour && (
        <span className="flex shrink-0 items-center justify-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          Twój
        </span>
      )}
    </div>
    <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
      <p className="text-xs text-gray-500">
        Z transakcją: {item.lastDealDate ? formatDate(item.lastDealDate) : 'Brak'}
      </p>
      <Link
        to={`/company/${item.id}`}
        className="text-xs font-medium text-blue-900 hover:underline"
      >
        Szczegóły
      </Link>
    </div>
  </div>
);
