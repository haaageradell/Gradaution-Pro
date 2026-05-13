import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { CreatePaymentMethodRequest, PaymentMethod } from '../models/payment-method.models';

@Injectable({ providedIn: 'root' })
export class PaymentMethodService {
  private readonly http = inject(HttpClient);
  private readonly paymentMethodBaseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/PaymentMethod`;

  /** GET /api/PaymentMethod */
  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(this.paymentMethodBaseUrl).pipe(
      catchError((err) => {
        console.error('[PaymentMethodService] getPaymentMethods error:', err);
        return throwError(() => err);
      }),
    );
  }

  /** POST /api/PaymentMethod */
  createPaymentMethod(body: CreatePaymentMethodRequest): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(this.paymentMethodBaseUrl, body).pipe(
      catchError((err) => {
        console.error('[PaymentMethodService] createPaymentMethod error:', err);
        return throwError(() => err);
      }),
    );
  }

  /** DELETE /api/PaymentMethod/{paymentMethodId} */
  deletePaymentMethod(paymentMethodId: string): Observable<void> {
    const url = `${this.paymentMethodBaseUrl}/${encodeURIComponent(paymentMethodId)}`;
    return this.http.delete<void>(url).pipe(
      catchError((err) => {
        console.error('[PaymentMethodService] deletePaymentMethod error:', err);
        return throwError(() => err);
      }),
    );
  }
}
