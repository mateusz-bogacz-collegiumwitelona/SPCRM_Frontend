export const getStatusConfig = (rawStatus: string) => {
  const status = (rawStatus || '').toLowerCase();

  switch (status) {
    case 'todo':
      return {
        label: 'Do podjęcia',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
      };

    case 'inprogress':
      return {
        label: 'W trakcie',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
      };

    case 'complete':
      return {
        label: 'Zakończona',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
      };

    case 'cancelled':
      return {
        label: 'Anulowana',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
      };

    default:
      return {
        label: rawStatus || 'Nieznany',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
      };
  }
};
