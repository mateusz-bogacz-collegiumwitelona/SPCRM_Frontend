import { useEffect, useRef, useState } from 'react';

const defaultGetId = <T>(item: T): string | number => {
  if (typeof item === 'object' && item !== null) {
    const record = item as Record<string, unknown>;
    const possibleId =
      record.id ??
      record.currencyId ??
      record.productId ??
      record.offerId ??
      record.invoiceProductId;

    if (typeof possibleId === 'string' || typeof possibleId === 'number') {
      return possibleId;
    }
  }

  return JSON.stringify(item);
};

function mergeListItems<T>(
  existing: T[],
  incoming: T[],
  idSelector?: (item: T) => string | number,
): T[] {
  const getId = idSelector ?? defaultGetId;
  const existingIds = new Set(existing.map((item) => getId(item)));
  const uniqueIncoming = incoming.filter((item) => !existingIds.has(getId(item)));
  return [...existing, ...uniqueIncoming];
}

interface UseAccumulatedMobileListOptions<T> {
  items?: T[];
  pageNumber: number;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
  resetDependencies?: unknown[];
  idSelector?: (item: T) => string | number;
}

export function useAccumulatedMobileList<T>({
  items,
  pageNumber,
  setPageNumber,
  resetDependencies = [],
  idSelector,
}: UseAccumulatedMobileListOptions<T>) {
  const [accumulatedData, setAccumulatedData] = useState<T[]>([]);
  const isMobileAppend = useRef(false);

  useEffect(() => {
    isMobileAppend.current = false;
    setPageNumber(1);
  }, resetDependencies);

  useEffect(() => {
    const currentItems = items || [];
    if (currentItems.length === 0) {
      if (pageNumber === 1) {
        setAccumulatedData([]);
      }
      return;
    }

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedData(currentItems);
      return;
    }

    setAccumulatedData((prev) => mergeListItems(prev, currentItems, idSelector));
  }, [items, pageNumber, idSelector]);

  const handleMobileLoadMore = () => {
    isMobileAppend.current = true;
    setPageNumber((prev) => prev + 1);
  };

  const handleDesktopPageChange = (newPage: number) => {
    isMobileAppend.current = false;
    setPageNumber(newPage);
  };

  return {
    accumulatedData,
    handleMobileLoadMore,
    handleDesktopPageChange,
  };
}
