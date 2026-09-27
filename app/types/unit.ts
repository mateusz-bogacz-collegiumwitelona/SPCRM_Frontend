import type { BasePaginationParams } from '~/types/table';

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

export type UnitListParams = BasePaginationParams;
