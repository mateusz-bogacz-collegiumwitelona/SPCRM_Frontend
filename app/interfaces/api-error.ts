export default interface ApiError {
  response?: {
    data?: {
      isSuccess?: boolean;
      success?: boolean;
      message?: string;
      errorCode?: string;
      errors?: string[];
    };
  };
  message?: string;
}
