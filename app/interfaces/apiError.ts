export default interface ApiError {
  response?: {
    data?: {
      success?: boolean;
      message?: string;
      errorCode?: string;
      errors?: string[];
    };
  };
  message?: string;
}
