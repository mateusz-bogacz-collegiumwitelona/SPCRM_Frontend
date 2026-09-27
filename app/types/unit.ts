export interface UnitOption {
  id: string;
  name: string;
  symbol: string;
}

export interface AddUnitRequestPayload {
  name: string;
  symbol: string;
  baseMultiplier: number;
}

export interface EditUnitRequestPayload {
  unitId: string;
  name?: string;
  symbol?: string;
  baseMultiplier?: number;
}

export interface UnitListResponse {
  id: string;
  name: string;
  symbol: string;
  baseMultiplier: number;
}

export interface UnitListParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy: string;
  sortDescending: boolean;
}

export interface PaginatedUnitsResponse {
  items: UnitListResponse[];
  totalPages: number;
  totalItems?: number;
  totalCount?: number;
}
