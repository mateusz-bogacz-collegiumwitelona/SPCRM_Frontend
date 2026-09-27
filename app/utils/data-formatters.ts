export const formatCurrency = (
  value: number | null | undefined,
  currencyCode: string = 'PLN',
  decimalPlaces: number = 2,
): string => {
  if (value == null) return '-';
  const actualValue = value / 10000;
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(actualValue);
};

export const formatWeight = (grams: number | null | undefined): string => {
  if (grams == null) return '-';
  const kg = grams / 1000;
  return `${new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(kg)} kg`;
};

export const formatDate = (isoDate: string) => {
  return new Date(isoDate).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
