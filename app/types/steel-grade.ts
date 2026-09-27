import type { BasePaginationParams } from '~/types/table';

export interface SteelGradeOption {
  id: string;
  name: string;
}

export interface AddSteelGradePayload {
  name: string;
  standard?: string | null;
  density: number | null;
}

export interface SteelGradeFormData {
  name: string;
  standard: string;
  density: number | '';
}

export interface EditSteelGradePayload {
  id: string;
  name: string;
  standard?: string | null;
  density?: number | null;
}

export interface SteelGradeListResponse {
  id: string;
  name: string;
  standard?: string | null;
  density: number;
}

export type SteelGradeListParams = BasePaginationParams;

export interface DeleteSteelGradeParams {
  id: string;
  reassignments: { productId: string; newSteelGradeId: string }[];
}

export interface SteelGradeProductItem {
  id: string;
  name: string;
  category: string;
}
