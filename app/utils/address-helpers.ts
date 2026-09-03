export const formatAddressType = (type?: string): string => {
  switch (type) {
    case 'Headquarters':
      return 'Siedziba główna';
    case 'Branch':
      return 'Oddział';
    case 'Billing':
      return 'Adres rozliczeniowy';
    case 'Shipping':
      return 'Adres dostawy';
    default:
      return type || 'Inny';
  }
};

export const getAddressTypeBadgeClass = (type?: string): string => {
  switch (type) {
    case 'Headquarters':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'Branch':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Billing':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Shipping':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};
