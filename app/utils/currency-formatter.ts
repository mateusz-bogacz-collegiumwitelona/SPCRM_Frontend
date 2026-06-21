export const formatCurrency = (value: number, decimalPlaces: number = 2): string => {
  const actualValue = value / 10000;
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(actualValue);
};
