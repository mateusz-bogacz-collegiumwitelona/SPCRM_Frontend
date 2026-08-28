import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import React from 'react';

export function mergeById<T extends { id?: string; currencyId?: string; productId?: string }>(
  existing: T[],
  incoming: T[],
  keyResolver: (item: T) => string = (item) => item.id || item.currencyId || item.productId || '',
): T[] {
  const existingKeys = new Set(existing.map(keyResolver));
  const uniqueIncoming = incoming.filter((item) => !existingKeys.has(keyResolver(item)));
  return [...existing, ...uniqueIncoming];
}

export const formatDateRangeLabel = (dateRange?: DateRange): React.ReactNode => {
  if (!dateRange?.from) {
    return React.createElement('span', null, 'Wybierz zakres dat');
  }
  if (dateRange.to) {
    return React.createElement(
      React.Fragment,
      null,
      `${format(dateRange.from, 'd MMM yyyy', { locale: pl })} - ${format(dateRange.to, 'd MMM yyyy', { locale: pl })}`,
    );
  }
  return format(dateRange.from, 'd MMM yyyy', { locale: pl });
};
