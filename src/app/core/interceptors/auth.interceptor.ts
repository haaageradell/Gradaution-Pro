import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const token = isBrowser ? localStorage.getItem('token') : null;
  console.log('[AuthInterceptor] token:', token);

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
