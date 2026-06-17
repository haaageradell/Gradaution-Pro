import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApplyCouponRequest,
  CreateOrderRequest,
  OrderDetail,
  OrderLineItem,
  OrderPaymentDetails,
  OrderPriceSummary,
  OrderShippingDetails,
  OrderStatusCounts,
  OrderSummary,
  OrderProfileStats,
  UpdateOrderStatusRequest,
} from '../models/order.model';
import { normalizeOrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly orderBaseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/Order`;
  private readonly ordersSubject = new BehaviorSubject<OrderSummary[]>([]);
  private ordersLoaded = false;
  private loadRequest$: Observable<OrderSummary[]> | null = null;

  /** Reactive order list — updated after fetch or new order placement */
  readonly orders$ = this.ordersSubject.asObservable();

  get ordersSnapshot(): OrderSummary[] {
    return this.ordersSubject.value;
  }

  /** Current user orders — GET /api/Order */
  getMyOrders(): Observable<OrderSummary[]> {
    return this.http.get<unknown>(this.orderBaseUrl).pipe(
      map((raw) => normalizeOrderList(raw)),
      catchError((err) => {
        console.error('[OrderService] getMyOrders error:', err);
        return throwError(() => err);
      }),
    );
  }

  /** GET /api/Order/{orderId} */
  getOrder(orderId: string): Observable<OrderDetail> {
    const url = `${this.orderBaseUrl}/${encodeURIComponent(orderId)}`;
    return this.http.get<unknown>(url).pipe(
      map((raw) => normalizeOrderDetail(raw, orderId)),
      catchError((err) => {
        console.error('[OrderService] getOrder error:', err);
        return throwError(() => err);
      }),
    );
  }

  /** Admin listing — GET /api/Order/all */
  getAllOrders(): Observable<OrderSummary[]> {
    return this.http.get<unknown>(`${this.orderBaseUrl}/all`).pipe(
      map((raw) => normalizeOrderList(raw)),
      catchError((err) => {
        console.error('[OrderService] getAllOrders error:', err);
        return throwError(() => err);
      }),
    );
  }

  /** Create order — POST /api/Order */
  createOrder(
    body: CreateOrderRequest | Record<string, unknown> = {},
  ): Observable<OrderDetail | OrderSummary> {
    return this.http.post<unknown>(this.orderBaseUrl, body).pipe(
      map((raw) => {
        const detail = normalizeOrderDetail(raw);
        if (detail.id) {
          return detail;
        }
        return normalizeOrderSummary(unwrapPayload(raw));
      }),
      tap((created) => {
        const summary = toOrderSummary(created);
        if (summary.id) {
          this.prependOrder(summary);
        }
      }),
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

  refreshOrders(): Observable<OrderSummary[]> {
    this.ordersLoaded = false;
    this.loadRequest$ = null;
    return this.ensureOrdersLoaded(true);
  }

  /**
   * Load orders once and share across Orders + Profile pages.
   * Subsequent calls return cached data unless forceRefresh is true.
   */
  ensureOrdersLoaded(forceRefresh = false): Observable<OrderSummary[]> {
    if (!forceRefresh && this.ordersLoaded) {
      return of(this.ordersSubject.value);
    }
    if (!forceRefresh && this.loadRequest$) {
      return this.loadRequest$;
    }

    this.loadRequest$ = this.getMyOrders().pipe(
      tap((orders) => {
        this.ordersSubject.next(orders);
        this.ordersLoaded = true;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
      finalize(() => {
        this.loadRequest$ = null;
      }),
    );

    return this.loadRequest$;
  }

  prependOrder(order: OrderSummary): void {
    const current = this.ordersSubject.value;
    const withoutDuplicate = current.filter((o) => o.id !== order.id);
    this.ordersSubject.next([order, ...withoutDuplicate]);
    this.ordersLoaded = true;
  }

  handleOrderPlaced(response: OrderDetail | OrderSummary | unknown): void {
    if (!response || typeof response !== 'object') {
      return;
    }
    const summary =
      'items' in (response as OrderDetail)
        ? toOrderSummary(response as OrderDetail)
        : toOrderSummary(response as OrderSummary);
    if (summary.id) {
      this.prependOrder(summary);
    }
  }

  computeStatusCounts(orders: OrderSummary[]): OrderStatusCounts {
    const counts: OrderStatusCounts = {
      total: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const order of orders) {
      switch (normalizeOrderStatus(order.status)) {
        case 'Pending':
          counts.pending++;
          break;
        case 'Processing':
          counts.processing++;
          break;
        case 'Shipped':
          counts.shipped++;
          break;
        case 'Delivered':
          counts.delivered++;
          break;
        case 'Cancelled':
          counts.cancelled++;
          break;
      }
    }
    return counts;
  }

  computeProfileStats(orders: OrderSummary[]): OrderProfileStats {
    const counts = this.computeStatusCounts(orders);
    const totalSpent = orders
      .filter((o) => normalizeOrderStatus(o.status) !== 'Cancelled')
      .reduce((sum, o) => sum + (Number.isFinite(o.totalAmount) ? o.totalAmount : 0), 0);

    return {
      totalOrders: counts.total,
      pendingOrders: counts.pending,
      deliveredOrders: counts.delivered,
      totalSpent,
      currency: orders[0]?.currency ?? 'EGP',
    };
  }

  getErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401) {
        return 'Please sign in to view your orders.';
      }
      if (err.status === 0) {
        return 'Network error. Check your connection and try again.';
      }
      const body = err.error;
      if (typeof body === 'string' && body.trim()) {
        return body;
      }
      if (body && typeof body === 'object') {
        const msg =
          (body as Record<string, unknown>)['message'] ??
          (body as Record<string, unknown>)['Message'] ??
          (body as Record<string, unknown>)['title'] ??
          (body as Record<string, unknown>)['Title'];
        if (typeof msg === 'string' && msg.trim()) {
          return msg;
        }
      }
      return 'Something went wrong while loading orders.';
    }
    return 'Something went wrong while loading orders.';
  }
}

function toOrderSummary(order: OrderDetail | OrderSummary): OrderSummary {
  if ('summary' in order && order.summary) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      orderDate: order.orderDate,
      totalAmount: order.summary.total || order.totalAmount,
      paymentMethod: order.payment?.methodLabel || order.paymentMethod,
      itemCount: order.items?.length ?? order.itemCount,
      shippingAddress:
        order.shipping?.formattedAddress || order.shippingAddress,
      currency: order.summary.currency || order.currency,
    };
  }
  return order as OrderSummary;
}

function normalizeOrderList(raw: unknown): OrderSummary[] {
  const list = extractArray(raw);
  return list
    .map((row) => normalizeOrderSummary(row))
    .filter((o) => o.id)
    .sort((a, b) => compareDatesDesc(a.orderDate, b.orderDate));
}

function normalizeOrderDetail(raw: unknown, fallbackId?: string): OrderDetail {
  const root = unwrapPayload(raw);
  const summary = normalizeOrderSummary(root, fallbackId);
  const items = extractItems(root).map((row) => mapOrderLineItem(row));
  const itemCount = items.length || summary.itemCount;
  const summaryBlock = pickPriceSummary(root, items);

  return {
    ...summary,
    itemCount,
    totalAmount: summaryBlock.total || summary.totalAmount,
    currency: summaryBlock.currency || summary.currency,
    items,
    summary: summaryBlock,
    shipping: pickShippingDetails(root),
    payment: pickPaymentDetails(root),
    estimatedDelivery:
      pickString(root, [
        'estimatedDelivery',
        'EstimatedDelivery',
        'deliveryDate',
        'DeliveryDate',
      ]) ?? null,
  };
}

function normalizeOrderSummary(
  row: unknown,
  fallbackId?: string,
): OrderSummary {
  if (!row || typeof row !== 'object') {
    return emptySummary(fallbackId);
  }
  const o = row as Record<string, unknown>;
  const id = String(
    o['id'] ??
      o['Id'] ??
      o['orderId'] ??
      o['OrderId'] ??
      o['orderID'] ??
      fallbackId ??
      '',
  );
  const orderNumber = String(
    o['orderNumber'] ??
      o['OrderNumber'] ??
      o['orderNo'] ??
      o['OrderNo'] ??
      (id ? `ORD-${id.slice(0, 8).toUpperCase()}` : ''),
  );
  const status = normalizeOrderStatus(
    o['status'] ?? o['Status'] ?? o['orderStatus'] ?? o['OrderStatus'],
  );
  const orderDate =
    pickString(o, [
      'orderDate',
      'OrderDate',
      'createdAt',
      'CreatedAt',
      'createdOn',
      'CreatedOn',
      'date',
      'Date',
    ]) ?? null;
  const totalAmount = pickNumber(o, [
    'total',
    'Total',
    'totalAmount',
    'TotalAmount',
    'grandTotal',
    'GrandTotal',
  ]);
  const currency = pickString(o, ['currency', 'Currency']) ?? 'EGP';
  const paymentMethod =
    pickPaymentLabel(o) ?? 'Card';
  const items = extractItems(o);
  const itemCount =
    pickNumber(o, ['itemCount', 'ItemCount', 'itemsCount', 'ItemsCount']) ||
    items.length ||
    pickNumber(o, ['quantity', 'Quantity']) ||
    0;
  const shippingAddress = pickShippingAddressText(o);

  return {
    id,
    orderNumber,
    status,
    orderDate,
    totalAmount,
    paymentMethod,
    itemCount,
    shippingAddress,
    currency,
  };
}

function mapOrderLineItem(raw: unknown): OrderLineItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      productId: 0,
      productName: 'Product',
      productImage: '',
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
    };
  }
  const o = raw as Record<string, unknown>;
  const id = String(o['id'] ?? o['Id'] ?? o['orderItemId'] ?? o['OrderItemId'] ?? '');
  const productId = Number(o['productId'] ?? o['ProductId'] ?? 0);
  const productName = String(
    o['productName'] ??
      o['ProductName'] ??
      o['name'] ??
      o['Name'] ??
      'Product',
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
  const quantity = Math.max(
    1,
    Number(o['quantity'] ?? o['Quantity'] ?? 1),
  );
  const unitPrice = Number(
    o['unitPrice'] ?? o['UnitPrice'] ?? o['price'] ?? o['Price'] ?? 0,
  );
  const subtotal = Number(
    o['subtotal'] ??
      o['Subtotal'] ??
      o['lineTotal'] ??
      o['LineTotal'] ??
      unitPrice * quantity,
  );
  return {
    id,
    productId,
    productName,
    productImage,
    quantity,
    unitPrice,
    subtotal: Number.isFinite(subtotal) ? subtotal : unitPrice * quantity,
  };
}

function pickPriceSummary(
  root: Record<string, unknown>,
  items: OrderLineItem[],
): OrderPriceSummary {
  const nested = root['summary'] ?? root['Summary'];
  if (nested && typeof nested === 'object') {
    const s = nested as Record<string, unknown>;
    return {
      subtotal: pickNumber(s, ['subtotal', 'Subtotal']),
      discount: pickNumber(s, ['discount', 'Discount']),
      shipping: pickNumber(s, ['shipping', 'Shipping', 'shippingCost', 'ShippingCost']),
      couponDiscount: pickNumber(s, ['couponDiscount', 'CouponDiscount']),
      total: pickNumber(s, ['total', 'Total']),
      currency: pickString(s, ['currency', 'Currency']) ?? 'EGP',
    };
  }

  const subtotal =
    pickNumber(root, ['subtotal', 'Subtotal', 'SubTotal']) ||
    items.reduce((sum, i) => sum + i.subtotal, 0);
  const discount = pickNumber(root, ['discount', 'Discount']);
  const shipping = pickNumber(root, [
    'shipping',
    'Shipping',
    'shippingCost',
    'ShippingCost',
  ]);
  const couponDiscount = pickNumber(root, [
    'couponDiscount',
    'CouponDiscount',
  ]);
  const total =
    pickNumber(root, ['total', 'Total', 'totalAmount', 'TotalAmount']) ||
    Math.max(0, subtotal - discount - couponDiscount + shipping);
  const currency = pickString(root, ['currency', 'Currency']) ?? 'EGP';

  return { subtotal, discount, shipping, couponDiscount, total, currency };
}

function pickShippingDetails(root: Record<string, unknown>): OrderShippingDetails {
  const addr = root['shippingAddress'] ?? root['ShippingAddress'];
  if (addr && typeof addr === 'object') {
    const a = addr as Record<string, unknown>;
    const recipientName = String(a['name'] ?? a['Name'] ?? a['recipientName'] ?? '');
    const badge = pickString(a, ['badge', 'Badge', 'type', 'Type']);
    const lines = pickStringArray(a, ['lines', 'Lines', 'addressLines', 'AddressLines']);
    const line1 = pickString(a, ['line1', 'Line1', 'street', 'Street']);
    const line2 = pickString(a, ['line2', 'Line2', 'city', 'City']);
    const combinedLines =
      lines.length > 0
        ? lines
        : [line1, line2].filter((l): l is string => Boolean(l));
    const phone = String(a['phone'] ?? a['Phone'] ?? '');
    const formattedAddress = [recipientName, ...combinedLines, phone]
      .filter(Boolean)
      .join(', ');
    return {
      recipientName,
      badge: badge ?? undefined,
      lines: combinedLines,
      phone,
      formattedAddress: formattedAddress || pickShippingAddressText(root),
    };
  }

  const text = pickShippingAddressText(root);
  return {
    recipientName: '',
    lines: text ? [text] : [],
    phone: '',
    formattedAddress: text,
  };
}

function pickPaymentDetails(root: Record<string, unknown>): OrderPaymentDetails {
  const pm = root['paymentMethod'] ?? root['PaymentMethod'];
  if (pm && typeof pm === 'object') {
    const p = pm as Record<string, unknown>;
    const brand = pickString(p, ['brand', 'Brand', 'provider', 'Provider']);
    const last4 = pickString(p, ['last4', 'Last4', 'lastDigits', 'LastDigits']);
    const methodId = String(p['id'] ?? p['Id'] ?? '');
    const methodLabel = [brand, last4 ? `•••• ${last4}` : ''].filter(Boolean).join(' ');
    return {
      methodId,
      methodLabel: methodLabel || pickPaymentLabel(root) || 'Card',
      brand: brand ?? undefined,
      last4: last4 ?? undefined,
    };
  }

  const methodId = String(
    root['paymentMethodId'] ?? root['PaymentMethodId'] ?? '',
  );
  return {
    methodId,
    methodLabel: pickPaymentLabel(root) || 'Card',
  };
}

function pickPaymentLabel(o: Record<string, unknown>): string | undefined {
  return (
    pickString(o, [
      'paymentMethod',
      'PaymentMethod',
      'paymentMethodName',
      'PaymentMethodName',
      'paymentType',
      'PaymentType',
    ]) ??
    (() => {
      const brand = pickString(o, ['cardBrand', 'CardBrand', 'brand', 'Brand']);
      const last4 = pickString(o, ['last4', 'Last4', 'lastDigits', 'LastDigits']);
      if (brand && last4) {
        return `${brand} •••• ${last4}`;
      }
      return brand ?? undefined;
    })()
  );
}

function pickShippingAddressText(o: Record<string, unknown>): string {
  const direct = pickString(o, [
    'shippingAddress',
    'ShippingAddress',
    'deliveryAddress',
    'DeliveryAddress',
    'address',
    'Address',
  ]);
  if (direct) {
    return direct;
  }
  const addr = o['shippingAddress'] ?? o['ShippingAddress'];
  if (addr && typeof addr === 'object') {
    return pickShippingDetails(o).formattedAddress;
  }
  return '—';
}

function emptySummary(fallbackId?: string): OrderSummary {
  return {
    id: fallbackId ?? '',
    orderNumber: fallbackId ? `ORD-${fallbackId.slice(0, 8).toUpperCase()}` : '',
    status: 'Pending',
    orderDate: null,
    totalAmount: 0,
    paymentMethod: '—',
    itemCount: 0,
    shippingAddress: '—',
    currency: 'EGP',
  };
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

function extractItems(root: Record<string, unknown>): unknown[] {
  for (const key of [
    'items',
    'Items',
    'orderItems',
    'OrderItems',
    'lines',
    'Lines',
  ]) {
    const v = root[key];
    if (Array.isArray(v)) {
      return v;
    }
  }
  return [];
}

function unwrapPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const obj = raw as Record<string, unknown>;
  if (obj['id'] || obj['Id'] || obj['orderId'] || obj['OrderId']) {
    return obj;
  }
  for (const key of ['data', 'Data', 'result', 'Result', 'value', 'Value']) {
    const inner = obj[key];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
  }
  return obj;
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

function pickStringArray(
  o: Record<string, unknown>,
  keys: string[],
): string[] {
  for (const key of keys) {
    const v = o[key];
    if (Array.isArray(v)) {
      return v.map((item) => String(item)).filter(Boolean);
    }
  }
  return [];
}

function pickNumber(o: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const v = o[key];
    const n = Number(v);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return 0;
}

function compareDatesDesc(a: string | null, b: string | null): number {
  const ta = a ? Date.parse(a) : 0;
  const tb = b ? Date.parse(b) : 0;
  return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
}
