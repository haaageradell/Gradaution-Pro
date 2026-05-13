import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import {
  CartCoupon,
  CartLineItem,
  CartPriceSummary,
  CartViewModel,
} from '../models/cart.models';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly cartApiUrl = `${environment.baseUrl}/api/Cart`;
  private readonly cartCountSubject = new BehaviorSubject<number>(0);

  cartCount$ = this.cartCountSubject.asObservable();
  updateCartCountFromItems(items: CartLineItem[]): void {
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

    this.cartCountSubject.next(totalCount);
  }
  getCart(): Observable<CartViewModel> {
    return this.http.get<unknown>(this.cartApiUrl).pipe(
      // tap((raw) =>
      //   console.log('[CartService] GET /api/Cart raw response:', raw),
      // ),
      map((raw) => normalizeCartResponse(raw)),
      // tap((cart) => console.log('[CartService] getCart normalized:', cart)),
      catchError((err) => {
        console.error('[CartService] getCart error:', err);
        return throwError(() => err);
      }),
    );
  }

  addToCart(body: unknown): Observable<unknown> {
    return this.http.post<unknown>(`${this.cartApiUrl}/add`, body).pipe(
      catchError((err) => {
        console.error('[CartService] addToCart error:', err);
        return throwError(() => err);
      }),
    );
  }

  updateCartItem(itemId: string, body: unknown): Observable<unknown> {
    return this.http
      .put<unknown>(
        `${this.cartApiUrl}/update/${encodeURIComponent(itemId)}`,
        body,
      )
      .pipe(
        catchError((err) => {
          console.error('[CartService] updateCartItem error:', err);
          return throwError(() => err);
        }),
      );
  }

  removeCartItem(itemId: string): Observable<unknown> {
    return this.http
      .delete<unknown>(
        `${this.cartApiUrl}/remove/${encodeURIComponent(itemId)}`,
      )
      .pipe(
        catchError((err) => {
          console.error('[CartService] removeCartItem error:', err);
          return throwError(() => err);
        }),
      );
  }

  clearCart(): Observable<unknown> {
    return this.http.delete<unknown>(`${this.cartApiUrl}/clear`).pipe(
      catchError((err) => {
        console.error('[CartService] clearCart error:', err);
        return throwError(() => err);
      }),
    );
  }
}

function normalizeCartResponse(raw: unknown): CartViewModel {
  const root = unwrapPayload(raw);
  const itemsRaw = pickArray(root, [
    'items',
    'Items',
    'cartItems',
    'CartItems',
    'lines',
    'Lines',
  ]);
  const items = itemsRaw.map((row) => mapCartLine(row));

  const summary = pickSummary(root, items);
  const coupon = pickCoupon(root);
  const estimatedDelivery =
    pickString(root, ['estimatedDelivery', 'EstimatedDelivery']) ?? undefined;

  return { items, summary, coupon, estimatedDelivery };
}

function unwrapPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const obj = raw as Record<string, unknown>;
  for (const key of ['data', 'Data', 'result', 'Result', 'value', 'Value']) {
    const inner = obj[key];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
  }
  return obj;
}

function pickArray(root: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const v = root[key];
    if (Array.isArray(v)) {
      return v;
    }
  }
  return [];
}

function mapCartLine(raw: unknown): CartLineItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      productId: 0,
      productName: '',
      productImage: '',
      unitPrice: 0,
      quantity: 0,
    };
  }
  const o = raw as Record<string, unknown>;
  const id = String(
    o['id'] ??
      o['Id'] ??
      o['cartItemId'] ??
      o['CartItemId'] ??
      o['lineId'] ??
      o['LineId'] ??
      '',
  );
  const productId = Number(o['productId'] ?? o['ProductId'] ?? 0);
  const productName = String(
    o['productName'] ?? o['ProductName'] ?? o['name'] ?? o['Name'] ?? '',
  );
  const productImage = String(
    o['thumbnailUrl'] ??
      o['ThumbnailUrl'] ??
      o['productImage'] ??
      o['ProductImage'] ??
      o['imageUrl'] ??
      o['ImageUrl'] ??
      o['image'] ??
      o['Image'] ??
      '',
  );
  const unitPrice = Number(
    o['unitPrice'] ?? o['UnitPrice'] ?? o['price'] ?? o['Price'] ?? 0,
  );
  const quantity = Number(o['quantity'] ?? o['Quantity'] ?? 1);
  return {
    id,
    productId,
    productName,
    productImage,
    unitPrice,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
  };
}

function pickSummary(
  root: Record<string, unknown>,
  items: CartLineItem[],
): CartPriceSummary {
  const nested = root['summary'] ?? root['Summary'];
  if (nested && typeof nested === 'object') {
    const s = nested as Record<string, unknown>;
    return {
      subtotal: Number(s['subtotal'] ?? s['Subtotal'] ?? 0),
      discount: Number(s['discount'] ?? s['Discount'] ?? 0),
      shipping: Number(s['shipping'] ?? s['Shipping'] ?? 0),
      couponDiscount: Number(s['couponDiscount'] ?? s['CouponDiscount'] ?? 0),
      total: Number(s['total'] ?? s['Total'] ?? 0),
    };
  }

  const subtotal = Number(
    root['subtotal'] ?? root['SubTotal'] ?? root['Subtotal'] ?? NaN,
  );
  const discount = Number(root['discount'] ?? root['Discount'] ?? 0);
  const shipping = Number(root['shipping'] ?? root['Shipping'] ?? 0);
  const couponDiscount = Number(
    root['couponDiscount'] ?? root['CouponDiscount'] ?? 0,
  );
  const total = Number(root['total'] ?? root['Total'] ?? NaN);

  const computedSubtotal = items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0,
  );

  const sub = Number.isFinite(subtotal) ? subtotal : computedSubtotal;
  const tot = Number.isFinite(total)
    ? total
    : Math.max(0, sub - discount - couponDiscount + shipping);

  return {
    subtotal: sub,
    discount,
    shipping,
    couponDiscount,
    total: tot,
  };
}

function pickCoupon(root: Record<string, unknown>): CartCoupon | null {
  const c = root['coupon'] ?? root['Coupon'];
  if (!c || typeof c !== 'object') {
    return null;
  }
  const o = c as Record<string, unknown>;
  const code = String(o['code'] ?? o['Code'] ?? '');
  const discountAmount = Number(
    o['discountAmount'] ?? o['DiscountAmount'] ?? 0,
  );
  const discountTypeRaw = String(
    o['discountType'] ?? o['DiscountType'] ?? 'fixed',
  ).toLowerCase();
  const discountType: 'fixed' | 'percentage' =
    discountTypeRaw === 'percentage' ? 'percentage' : 'fixed';
  const isApplied = Boolean(o['isApplied'] ?? o['IsApplied'] ?? false);
  if (!code && !isApplied) {
    return null;
  }
  return { code, discountAmount, discountType, isApplied };
}

function pickString(
  root: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const v = root[key];
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  return null;
}
