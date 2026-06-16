import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  CreatePaymentMethodRequest,
  PaymentMethodView,
} from '../models/payment-method.models';

@Injectable({ providedIn: 'root' })
export class PaymentMethodService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/PaymentMethod`;

  /** GET /api/PaymentMethod */
  getPaymentMethods(): Observable<PaymentMethodView[]> {
    return this.http.get<unknown>(this.baseUrl).pipe(
      map((raw) => normalizePaymentMethodList(raw)),
      catchError((err) => {
        console.error('[PaymentMethodService] getPaymentMethods error:', err);
        return throwError(() => err);
      }),
    );
  }

  /** POST /api/PaymentMethod */
  addPaymentMethod(
    body: CreatePaymentMethodRequest | Record<string, unknown>,
  ): Observable<unknown> {
    return this.http.post<unknown>(this.baseUrl, body).pipe(
      catchError((err) => {
        console.error('[PaymentMethodService] addPaymentMethod error:', err);
        return throwError(() => err);
      }),
    );
  }

  /** DELETE /api/PaymentMethod/{paymentMethodId} */
  deletePaymentMethod(paymentMethodId: string): Observable<unknown> {
    const url = `${this.baseUrl}/${encodeURIComponent(paymentMethodId)}`;
    return this.http.delete<unknown>(url).pipe(
      catchError((err) => {
        console.error('[PaymentMethodService] deletePaymentMethod error:', err);
        return throwError(() => err);
      }),
    );
  }
}

function normalizePaymentMethodList(raw: unknown): PaymentMethodView[] {
  const list = extractArray(raw);
  return list.map((row) => mapPaymentMethod(row));
}

function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  const root = raw as Record<string, unknown>;
  const wrapped = unwrapPayload(root);
  for (const key of [
    'items',
    'Items',
    'data',
    'Data',
    'paymentMethods',
    'PaymentMethods',
  ]) {
    const v = wrapped[key];
    if (Array.isArray(v)) {
      return v;
    }
  }
  return [];
}

function unwrapPayload(obj: Record<string, unknown>): Record<string, unknown> {
  for (const key of ['data', 'Data', 'result', 'Result', 'value', 'Value']) {
    const inner = obj[key];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
  }
  return obj;
}

function mapPaymentMethod(row: unknown): PaymentMethodView {
  if (!row || typeof row !== 'object') {
    return {
      id: '',
      last4: '0000',
      expiryMonth: null,
      expiryYear: null,
      brand: null,
      cardHolderName: null,
    };
  }
  const o = row as Record<string, unknown>;
  const id = String(
    o['id'] ?? o['Id'] ?? o['paymentMethodId'] ?? o['PaymentMethodId'] ?? '',
  );
  const last4Raw =
    o['lastDigits'] ??
    o['LastDigits'] ??
    o['last4'] ??
    o['Last4'] ??
    o['lastFourDigits'] ??
    o['maskedCardNumber'] ??
    o['MaskedCardNumber'] ??
    o['cardNumber'] ??
    o['CardNumber'];
  const last4 = maskLastFour(last4Raw);
  const expireDateRaw = pickString(o, ['expireDate', 'ExpireDate']);
  const parsedExpiry = parseExpireDate(expireDateRaw);
  const expiryMonth =
    pickNumber(o, [
      'expiryMonth',
      'ExpiryMonth',
      'expirationMonth',
      'ExpirationMonth',
    ]) ?? parsedExpiry?.month ?? null;
  const expiryYear =
    pickNumber(o, [
      'expiryYear',
      'ExpiryYear',
      'expirationYear',
      'ExpirationYear',
    ]) ?? parsedExpiry?.year ?? null;
  const brand = pickString(o, [
    'provider',
    'Provider',
    'brand',
    'Brand',
    'cardBrand',
    'CardBrand',
    'type',
    'Type',
  ]);
  const cardHolderName = pickString(o, [
    'cardHolderName',
    'CardHolderName',
    'nameOnCard',
    'NameOnCard',
    'holderName',
    'HolderName',
  ]);
  return { id, last4, expiryMonth, expiryYear, brand, cardHolderName };
}

function maskLastFour(raw: unknown): string {
  if (raw == null) {
    return '0000';
  }
  const s = String(raw).replace(/\D/g, '');
  if (s.length >= 4) {
    return s.slice(-4);
  }
  return s.padStart(4, '0');
}

function pickNumber(o: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === 'number' && Number.isFinite(v)) {
      return v;
    }
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) {
        return n;
      }
    }
  }
  return null;
}

function pickString(o: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  return null;
}

function parseExpireDate(
  raw: string | null,
): { month: number; year: number } | null {
  if (!raw) {
    return null;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return { month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
}
