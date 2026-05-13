import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/** API paths that require a Bearer token before the request is sent. */
const PROTECTED_API_PREFIXES = [
  '/api/cart',
  '/api/wishlist',
  '/api/profile',
  '/api/paymentmethod',
  '/api/order',
  '/api/admin',
  '/api/auth/change-password',
] as const;

function getRequestPath(url: string): string {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return new URL(url).pathname.split('?')[0].toLowerCase();
    }
  } catch {
    /* relative URL */
  }
  return url.split('?')[0].toLowerCase();
}

function requestRequiresAuthToken(url: string): boolean {
  const path = getRequestPath(url);
  return PROTECTED_API_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isSameBackendRequest(url: string): boolean {
  const base = environment.baseUrl.replace(/\/$/, '').toLowerCase();
  const api = environment.apiUrl.replace(/\/$/, '').toLowerCase();
  const lower = url.toLowerCase();
  return (
    lower.startsWith(base) || lower.startsWith(api) || lower.startsWith('/api/')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const token = isBrowser ? localStorage.getItem('token') : null;
  // console.log('[AuthInterceptor] token:', token);

  if (
    isBrowser &&
    !token &&
    isSameBackendRequest(req.url) &&
    requestRequiresAuthToken(req.url)
  ) {
    console.warn('[AuthInterceptor] blocked request without token:', req.url);
    router.navigateByUrl('/login');
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: req.url,
          error: 'Missing authentication token',
        }),
    );
  }

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.error('[AuthInterceptor] 401 Unauthorized:', error);
        if (isBrowser) {
          localStorage.removeItem('token');
          router.navigateByUrl('/login');
        }
      }
      return throwError(() => error);
    }),
  );
};
