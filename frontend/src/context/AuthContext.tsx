import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { api } from "../services/api";

import {
  setAccessToken,
} from "../services/token";

import type {
  LoginResponse,
  RefreshResponse,
  User,
} from "../types/auth";

interface AuthContextValue {
  user: User | null;

  loading: boolean;

  accessToken: string | null;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | null>(
    null
  );

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({
  children,
}: AuthProviderProps) => {
  const [
    user,
    setUser,
  ] =
    useState<User | null>(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    accessTokenState,
    setAccessTokenState,
  ] =
    useState<string | null>(null);

  const updateToken = (
    token: string | null
  ) => {
    setAccessToken(token);

    setAccessTokenState(token);
  };

  useEffect(() => {
    const restoreSession =
      async () => {
        try {
          const response =
            await api.post<RefreshResponse>(
              "/auth/refresh"
            );

          const {
            accessToken,
            user,
          } =
            response.data.data;

          updateToken(
            accessToken
          );

          setUser(user);
        } catch {
          updateToken(null);

          setUser(null);
        } finally {
          setLoading(false);
        }
      };

    void restoreSession();
  }, []);

  const login = async (
    email: string,
    password: string
  ) => {
    const response =
      await api.post<LoginResponse>(
        "/auth/login",
        {
          email,
          password,
        }
      );

    const {
      accessToken,
      user,
    } =
      response.data.data;

    updateToken(
      accessToken
    );

    setUser(user);
  };

  const logout = async () => {
    try {
      await api.post(
        "/auth/logout"
      );
    } finally {
      updateToken(null);

      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken:
          accessTokenState,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};