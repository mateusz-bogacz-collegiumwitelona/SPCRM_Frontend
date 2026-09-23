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
