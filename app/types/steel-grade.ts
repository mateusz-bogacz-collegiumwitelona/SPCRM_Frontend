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

export interface SteelGradeListParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy: string;
  sortDescending: boolean;
}

export interface PaginatedSteelGradesResponse {
  items: SteelGradeListResponse[];
  totalPages: number;
  totalItems?: number;
  totalCount?: number;
}

export interface DeleteSteelGradeParams {
  id: string;
  reassignments: { productId: string; newSteelGradeId: string }[];
}
