import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { Building2, Calendar, CircleDollarSign, Tag, User } from 'lucide-react';
import { formatCurrency } from '~/utils/currency-formatter';
import { getStatusConfig } from '~/utils/sale-status';

interface SaleDetailResponse {
  id: string;
  name: string;
  value: number;
  status: string;
  closeDate: string;
  currencyCode: string;
  decimalPlaces: number;
  ownerFirstName: string;
  ownerLastName: string;
  companyName: string;
}

export const SaleInfo = ({ dealId }: { dealId: string }) => {
  const {
    data: deal,
    isLoading,
    isError,
  } = useQuery<SaleDetailResponse>({
    queryKey: ['deal-info', dealId],
    queryFn: async () => {
      const response = await api.get(`/sales/${dealId}`);
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="mb-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  if (isError || !deal)
    return <div className="text-red-500 mb-6">Nie udało się pobrać danych zadania.</div>;

  const status = getStatusConfig(deal.status);

  return (
    <div className="mb-6">
      {/* NAGŁÓWEK */}
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-normal text-[#004a8f] mb-4">{deal.name}</h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status - można tu w przyszłości dodać dynamiczne kolory na podstawie statusu */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${status.bgColor} ${status.textColor}`}
          >
            <Tag className="w-3.5 h-3.5" />
            {status.label}
          </span>

          {/* Data Zamknięcia */}
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <Calendar className="w-4 h-4" />
            {new Date(deal.closeDate).toLocaleDateString('pl-PL', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* KARTA ZE SZCZEGÓŁAMI BIZNESOWYMI */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Klient */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
              <Building2 className="w-4 h-4 text-gray-400" /> Klient
            </span>
            <span className="text-base text-gray-900 font-semibold">{deal.companyName}</span>
          </div>

          {/* Opiekun Handlowy */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
              <User className="w-4 h-4 text-gray-400" /> Opiekun handlowy
            </span>
            <span className="text-base text-gray-900 font-medium">
              {deal.ownerFirstName} {deal.ownerLastName}
            </span>
          </div>

          {/* Wartość */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
              <CircleDollarSign className="w-4 h-4 text-gray-400" /> Wartość netto
            </span>
            <span className="text-xl text-green-600 font-bold tracking-tight">
              {formatCurrency(deal.value, deal.decimalPlaces)} {deal.currencyCode}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
