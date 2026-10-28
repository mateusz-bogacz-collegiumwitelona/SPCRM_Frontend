import type ApiError from '~/types/api-error';
import axios from 'axios';

export const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor rozpakowujący pole `data` wyłącznie dla `Result<T>`
client.interceptors.response.use((response) => {
  const body = response.data;

  // 1. Jeśli odpowiedź nie ma ciała (np. 204 No Content, puste odpowiedzi w auth), zwróć jak jest
  if (!body || typeof body !== 'object') {
    return response;
  }

  // 2. Jeśli pobierasz pliki binarne (np. PDF z raportem lub fakturą), nie ruszaj odpowiedzi
  if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
    return response;
  }

  if ('data' in body && 'isSuccess' in body) {
    return {
      ...response,
      data: body.data,
    };
  }

  return response;
});

export const isNotFoundError = (error: unknown): boolean => {
  const apiError = error as ApiError | null;
  return apiError?.response?.status === 404 || apiError?.response?.data?.errorCode === 'NOT_FOUND';
};
