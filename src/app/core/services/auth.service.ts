import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authApiUrl = `${environment.apiUrl}/api/Auth`;

  /**
   * Pulls JWT from typical backend shapes (camelCase, PascalCase, small wrappers).
   */
  extractJwtFromAuthResponse(response: unknown): string | null {
    return extractJwtFromAuthResponseInternal(response, 0);
  }

  /**
   * Persists JWT under localStorage key `token`. Browser-only.
   * @returns the stored token, or null if nothing could be saved.
   */
  persistAuthToken(response: unknown): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const jwt = this.extractJwtFromAuthResponse(response);
    if (!jwt) {
      return null;
    }
    localStorage.setItem('token', jwt);
    return jwt;
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<RegisterResponse>(`${this.authApiUrl}/register`, payload)
      .pipe(catchError((error) => this.handleError(error)));
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.authApiUrl}/login`, payload)
      .pipe(catchError((error) => this.handleError(error)));
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<unknown> {
    return this.http
      .post(`${this.authApiUrl}/forgot-password`, payload)
      .pipe(catchError((error) => this.handleError(error)));
  }

  resetPassword(payload: ResetPasswordRequest): Observable<unknown> {
    return this.http
      .post(`${this.authApiUrl}/reset-password`, payload)
      .pipe(catchError((error) => this.handleError(error)));
  }

  changePassword(payload: ChangePasswordRequest): Observable<unknown> {
    return this.http
      .put(`${this.authApiUrl}/change-password`, payload)
      .pipe(catchError((error) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const backendMessage =
      (error.error as { message?: string; title?: string })?.message ??
      (error.error as { message?: string; title?: string })?.title;

    const message =
      backendMessage ??
      (typeof error.error === 'string' ? error.error : null) ??
      'An unexpected error occurred. Please try again.';

    return throwError(() => new Error(message));
  }
}

const JWT_DIRECT_KEYS = [
  'token',
  'Token',
  'accessToken',
  'AccessToken',
  'access_token',
  'jwt',
  'Jwt',
  'jwtToken',
  'JwtToken',
  'bearerToken',
  'BearerToken',
] as const;

const JWT_WRAPPER_KEYS = ['data', 'Data', 'result', 'Result', 'value', 'Value'] as const;

/** Typical JWT compact serialization: three base64url segments. */
const JWT_LIKE =
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

function extractJwtFromAuthResponseInternal(
  response: unknown,
  depth: number,
): string | null {
  if (depth > 4 || !response || typeof response !== 'object') {
    return null;
  }
  const obj = response as Record<string, unknown>;
  for (const key of JWT_DIRECT_KEYS) {
    const value = obj[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  for (const key of JWT_WRAPPER_KEYS) {
    const inner = obj[key];
    if (inner && typeof inner === 'object') {
      const nested = extractJwtFromAuthResponseInternal(inner, depth + 1);
      if (nested) {
        return nested;
      }
    }
  }
  for (const key of ['user', 'User', 'auth', 'Auth', 'payload', 'Payload']) {
    const inner = obj[key];
    if (inner && typeof inner === 'object') {
      const nested = extractJwtFromAuthResponseInternal(inner, depth + 1);
      if (nested) {
        return nested;
      }
    }
  }
  return findJwtLikeStringInTree(response, 0);
}

function findJwtLikeStringInTree(
  node: unknown,
  walkDepth: number,
): string | null {
  if (walkDepth > 10 || node == null) {
    return null;
  }
  if (typeof node === 'string') {
    const t = node.trim();
    return JWT_LIKE.test(t) ? t : null;
  }
  if (typeof node !== 'object') {
    return null;
  }
  if (Array.isArray(node)) {
    for (const el of node) {
      const found = findJwtLikeStringInTree(el, walkDepth + 1);
      if (found) {
        return found;
      }
    }
    return null;
  }
  for (const v of Object.values(node as Record<string, unknown>)) {
    const found = findJwtLikeStringInTree(v, walkDepth + 1);
    if (found) {
      return found;
    }
  }
  return null;
}
