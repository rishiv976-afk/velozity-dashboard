import axios from "axios";

import {
  getAccessToken,
  setAccessToken,
} from "./token";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let refreshPromise: Promise<string> | null =
  null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh")
      .then((response) => {
        const token =
          response.data.data.accessToken as string;

        setAccessToken(token);

        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const token =
          await refreshAccessToken();

        originalRequest.headers.Authorization =
          `Bearer ${token}`;

        return api(originalRequest);
      } catch {
        setAccessToken(null);

        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);