import type ApiError from '~/types/api-error';
import axios from 'axios';

const getBaseUrl = () => {
  if (globalThis.window === undefined) {
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    return `${serverUrl.replace(/\/$/, '')}/api`;
  }
  return '/api';
};

export const client = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

client.interceptors.response.use((response) => {
  const body = response.data;

  if (!body || typeof body !== 'object') {
    return response;
  }

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
