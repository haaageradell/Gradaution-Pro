import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApplyCouponRequest,
  CreateOrderRequest,
  OrderListItem,
  UpdateOrderStatusRequest,
} from '../models/order-api.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly orderBaseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/Order`;

  /** Current user orders — GET /api/Order */
  getMyOrders(): Observable<OrderListItem[]> {
    return this.http.get<unknown>(this.orderBaseUrl).pipe(
      map((raw) => normalizeOrderList(raw)),
      catchError((err) => {
        console.error('[OrderService] getMyOrders error:', err);
        return throwError(() => err);
      }),
    );
  }

  /** GET /api/Order/{orderId} */
  getOrder(orderId: string): Observable<unknown> {
    const url = `${this.orderBaseUrl}/${encodeURIComponent(orderId)}`;
    return this.http.get<unknown>(url).pipe(
      catchError((err) => {
        console.error('[OrderService] getOrder error:', err);
        return throwError(() => err);
      }),
    );
  }

  /** Admin listing — GET /api/Order/all */
  getAllOrders(): Observable<unknown> {
    return this.http.get<unknown>(`${this.orderBaseUrl}/all`).pipe(
      catchError((err) => {
        console.error('[OrderService] getAllOrders error:', err);
        return throwError(() => err);
      }),
    );
  }

  /** Create order — POST /api/Order */
  createOrder(body: CreateOrderRequest | Record<string, unknown> = {}): Observable<unknown> {
    return this.http.post<unknown>(this.orderBaseUrl, body).pipe(
      catchError((err) => {
        console.error('[OrderService] createOrder error:', err);
        return throwError(() => err);
      }),
    );
  }

  /** PUT /api/Order/{orderId}/status */
  updateOrderStatus(
    orderId: string,
    body: UpdateOrderStatusRequest,
  ): Observable<unknown> {
    const url = `${this.orderBaseUrl}/${encodeURIComponent(orderId)}/status`;
    return this.http.put<unknown>(url, body).pipe(
      catchError((err) => {
        console.error('[OrderService] updateOrderStatus error:', err);
        return throwError(() => err);
      }),
    );
  }

  /** POST /api/Order/{orderId}/coupon */
  applyCoupon(orderId: string, body: ApplyCouponRequest): Observable<unknown> {
    const url = `${this.orderBaseUrl}/${encodeURIComponent(orderId)}/coupon`;
    return this.http.post<unknown>(url, body).pipe(
      catchError((err) => {
        console.error('[OrderService] applyCoupon error:', err);
        return throwError(() => err);
      }),
    );
  }
}

function normalizeOrderList(raw: unknown): OrderListItem[] {
  const list = extractArray(raw);
  return list.map((row) => mapOrderListItem(row));
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
  for (const key of ['items', 'Items', 'orders', 'Orders', 'data', 'Data']) {
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

function mapOrderListItem(row: unknown): OrderListItem {
  if (!row || typeof row !== 'object') {
    return { id: '', raw: {} };
  }
  const o = row as Record<string, unknown>;
  const id = String(
    o['id'] ??
      o['Id'] ??
      o['orderId'] ??
      o['OrderId'] ??
      o['orderID'] ??
      '',
  );
  const status = pickString(o, ['status', 'Status', 'orderStatus', 'OrderStatus']);
  return { id, status: status ?? undefined, raw: o as Record<string, unknown> };
}

function pickString(
  o: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  return undefined;
}
