import React from 'react';
import { flexRender, type Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface CompactTableProps<TData> {
  readonly table: Table<TData>;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly totalItems: number;
  readonly pageNumber: number;
  readonly totalPages: number;
  readonly onPageChange: (newPage: number) => void;
  readonly emptyMessage: string;
  readonly loadingMessage?: string;
}

export function CompactTable<TData>({
  table,
  isLoading,
  isFetching,
  totalItems,
  pageNumber,
  totalPages,
  onPageChange,
  emptyMessage,
  loadingMessage = 'Wczytywanie danych...',
}: CompactTableProps<TData>) {
  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center flex-1 py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-900 mb-2" />
        <p className="text-xs text-gray-400">{loadingMessage}</p>
      </div>
    );
  } else if (totalItems === 0) {
    content = (
      <div className="flex items-center justify-center flex-1 text-xs text-gray-400 py-12">
        {emptyMessage}
      </div>
    );
  } else {
    content = (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-2 font-medium">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 text-xs">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="relative min-h-63.75 flex flex-col justify-between">
      {content}

      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between text-xs text-gray-500 mt-auto">
        <span>
          Strona {pageNumber} z {totalPages}
        </span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.max(pageNumber - 1, 1))}
            disabled={pageNumber === 1 || isFetching}
            className="h-7 w-7 border-gray-200"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.min(pageNumber + 1, totalPages))}
            disabled={pageNumber >= totalPages || isFetching}
            className="h-7 w-7 border-gray-200"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
