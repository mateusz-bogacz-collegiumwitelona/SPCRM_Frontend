import type { OfferListResponse } from '~/types/offer';
import { getStatusBadge } from '~/components/offer/offer-status-badge';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Link } from 'react-router';

export const OfferMobileCard = ({ offer }: { readonly offer: OfferListResponse }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-2 flex justify-between items-start">
      <div>
        <p className="text-sm font-bold text-blue-900">{offer.offerName}</p>
        <p className="text-xs font-medium text-gray-900 mt-0.5">{offer.companyName}</p>
        <p className="text-xs text-gray-500">
          {offer.contactFirstName} {offer.contactLastName}
        </p>
      </div>
      <div>{getStatusBadge(offer.status, offer.isExpired)}</div>
    </div>
    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
      <div className="text-xs text-gray-500">
        Ważna do:{' '}
        {offer.validUntil ? format(new Date(offer.validUntil), 'dd.MM.yyyy', { locale: pl }) : '-'}
      </div>
      <Link
        to={`/offers/${offer.offerId}`}
        className="text-xs font-medium text-blue-900 hover:underline"
      >
        Szczegóły
      </Link>
    </div>
  </div>
);
