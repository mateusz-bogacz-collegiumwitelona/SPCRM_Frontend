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
