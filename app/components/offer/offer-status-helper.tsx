import React from 'react';

export const getStatusBadge = (status: string, isExpired: boolean) => {
  if (status === 'Accepted') {
    return (
      <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
        Zaakceptowana
      </span>
    );
  }

  if (status === 'Rejected') {
    return (
      <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
        Odrzucona
      </span>
    );
  }

  if (isExpired || status === 'Expired') {
    return (
      <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
        Wygasła
      </span>
    );
  }

  if (status === 'Sent') {
    return (
      <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
        Wysłana
      </span>
    );
  }

  return (
    <span className="bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
      {status}
    </span>
  );
};

export const formatOfferStatusLabel = (status: string): string => {
  switch (status) {
    case 'Sent':
      return 'Wysłana';
    case 'Accepted':
      return 'Zaakceptowana';
    case 'Rejected':
      return 'Odrzucona';
    case 'Expired':
      return 'Wygasła';
    default:
      return status;
  }
};
