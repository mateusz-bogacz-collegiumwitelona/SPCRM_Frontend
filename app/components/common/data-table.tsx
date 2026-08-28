import React from 'react';
import { flexRender, type Table as ReactTableInstance } from '@tanstack/react-table';
import { TablePagination, type TablePaginationProps } from '~/components/common/table-pagination';
import {
  MobileLoadMoreButton,
  TableEmptyState,
  TableLoadingState,
} from '~/components/common/table-state-views';

interface DataTableProps<T> {
  readonly table: ReactTableInstance<T>;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly data: T[];
  readonly pageNumber: number;
  readonly totalPages: number;
  readonly isFetching: boolean;
  readonly onMobileLoadMore: () => void;
  readonly paginationProps: TablePaginationProps;
  readonly renderMobileCard: (item: T) => React.ReactNode;
  readonly mobileCardKeyExtractor: (item: T) => string;
  readonly emptyMessage?: string;
  readonly loadingMessage?: string;
}

export function DataTable<T>({
  table,
  isLoading,
  isError,
  data,
  pageNumber,
  totalPages,
  isFetching,
  onMobileLoadMore,
  paginationProps,
  renderMobileCard,
  mobileCardKeyExtractor,
  emptyMessage = 'Brak wyników do wyświetlenia.',
  loadingMessage = 'Ładowanie danych...',
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableLoadingState message={loadingMessage} />;
  }

  if (data.length === 0 && !isError) {
    return <TableEmptyState message={emptyMessage} />;
  }

  return (
    <>
      <div className="block lg:hidden space-y-4">
        {data.map((item) => (
          <React.Fragment key={mobileCardKeyExtractor(item)}>
            {renderMobileCard(item)}
          </React.Fragment>
        ))}

        {pageNumber < totalPages && (
          <MobileLoadMoreButton isFetching={isFetching} onClick={onMobileLoadMore} />
        )}
      </div>

      <div className="hidden lg:block space-y-4">
        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="border-b border-gray-200 px-6 py-4 text-left text-sm font-semibold text-gray-900"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination {...paginationProps} />
      </div>
    </>
  );
}
