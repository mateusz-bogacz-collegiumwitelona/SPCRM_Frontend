import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;

    if (data?.errors) {
      const messages = Object.values(data.errors).flat();
      return Promise.reject([messages]);
    }

    if (data?.message) {
      return Promise.reject([data.message]);
    }

    return Promise.reject(["Server error. Please try again later."]);
  },
);
