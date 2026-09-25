export type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  success: boolean;

  data: {
    accessToken: string;
    user: User;
  };
}

export interface RefreshResponse {
  success: boolean;

  data: {
    accessToken: string;
    user: User;
  };
}