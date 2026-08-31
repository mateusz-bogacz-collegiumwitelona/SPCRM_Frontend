export const getStatusBadge = (status: string, isExpired: boolean) => {
  if (isExpired && status !== 'Accepted') {
    return (
      <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
        Wygasła
      </span>
    );
  }

  switch (status) {
    case 'Draft':
      return (
        <span className="bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          Szkic
        </span>
      );
    case 'Sent':
      return (
        <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          Wysłana
        </span>
      );
    case 'Accepted':
      return (
        <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          Zaakceptowana
        </span>
      );
    case 'Rejected':
      return (
        <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          Odrzucona
        </span>
      );
    case 'Expired':
      return (
        <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          Wygasła
        </span>
      );
    default:
      return (
        <span className="bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          {status}
        </span>
      );
  }
};
