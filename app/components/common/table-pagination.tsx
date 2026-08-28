import React from 'react';
import { Button } from '~/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TablePaginationProps {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly isFetching: boolean;
  readonly onPageSizeChange: (newPageSize: number) => void;
  readonly onPageChange: (newPage: number) => void;
  readonly pageSizeOptions?: number[];
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  pageNumber,
  pageSize,
  totalPages,
  totalItems,
  isFetching,
  onPageSizeChange,
  onPageChange,
  pageSizeOptions = [10, 25, 50],
}) => {
  const startItem = Math.min((pageNumber - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(pageNumber * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Pozycji na stronie:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:ring-blue-900 focus:border-blue-900 text-gray-700 shadow-sm"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-gray-500">
        Wyświetlanie {startItem} do {endItem} z {totalItems} wyników
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={() => onPageChange(Math.max(pageNumber - 1, 1))}
          disabled={pageNumber === 1 || isFetching}
          variant="outline"
          size="icon"
          className="h-9 w-9 text-blue-900 border-gray-300 hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm font-medium text-gray-700 px-2">
          Strona {pageNumber} z {totalPages}
        </span>

        <Button
          type="button"
          onClick={() => onPageChange(Math.min(pageNumber + 1, totalPages))}
          disabled={pageNumber === totalPages || isFetching}
          variant="outline"
          size="icon"
          className="h-9 w-9 text-blue-900 border-gray-300 hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
