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

export interface PaginatedResponse<T> {
  items: T[];
  totalPages: number;
  totalItems?: number;
  totalCount?: number;
}

export interface BasePaginationParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export type InvoicePaymentsParams = BasePaginationParams;
export type InvoiceProductsParams = BasePaginationParams;
