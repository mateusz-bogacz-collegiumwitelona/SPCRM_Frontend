import axios from 'axios';
import type ApiError from '~/interfaces/api-error';

export const api = axios.create({
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
