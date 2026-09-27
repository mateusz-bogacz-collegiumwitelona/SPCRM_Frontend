import type ApiError from '~/types/api-error';

export const axios = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const isNotFoundError = (error: unknown): boolean => {
  const apiError = error as ApiError | null;
  return apiError?.response?.status === 404 || apiError?.response?.data?.errorCode === 'NOT_FOUND';
};
