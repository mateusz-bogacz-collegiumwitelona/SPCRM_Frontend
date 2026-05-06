export default interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}
