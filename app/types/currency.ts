export interface AddCurrencyRequestPayload {
  name: string;
  code: string;
  decimalPlaces: number;
}

export interface EditCurrencyRequestPayload {
  currencyId: string;
  name?: string;
  code?: string;
  decimalPlaces?: number;
}

export interface CurrencyListParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy: string;
  sortDescending: boolean;
}

export interface PaginatedCurrenciesResponse {
  items: CurrencySimple[];
  totalPages: number;
  totalItems?: number;
  totalCount?: number;
}

export interface CurrencySimple {
  currencyId: string;
  name: string;
  code: string;
  decimalPlace: number;
}
