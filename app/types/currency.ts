import type { BasePaginationParams } from '~/types/table';

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

export type CurrencyListParams = BasePaginationParams;

export interface CurrencySimple {
  currencyId: string;
  name: string;
  code: string;
  decimalPlace: number;
}
