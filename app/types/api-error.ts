export interface ResultData {
  isSuccess?: boolean;
  success?: boolean;
  message?: string;
  errorCode?: string;
  errors?: string[];
}

export interface ApiError {
  response?: {
    data?: ResultData;
    status?: number;
  };
  message?: string;
}

export interface FormErrorState {
  title: string;
  details?: string[];
}

export type { ApiError as default };
