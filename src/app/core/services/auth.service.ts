import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
  private readonly authApiUrl = `${environment.apiUrl}/api/Auth`;
  constructor(private readonly http: HttpClient) {}

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
