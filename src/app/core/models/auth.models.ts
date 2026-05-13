export interface RegisterRequest {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  message?: string;
  token?: string;
  Token?: string;
  accessToken?: string;
  AccessToken?: string;
  errors?: string[];
  [key: string]: unknown;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  /** camelCase (.NET default JSON naming) */
  token?: string;
  /** PascalCase (some ASP.NET serializers) */
  Token?: string;
  accessToken?: string;
  AccessToken?: string;
  refreshToken?: string;
  RefreshToken?: string;
  expiresIn?: number;
  errors?: string[];
  [key: string]: unknown;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
