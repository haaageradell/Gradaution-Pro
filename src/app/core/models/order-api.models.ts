/** API-aligned order types (camelCase JSON; server may return PascalCase — normalized in services). */

export interface CreateOrderRequest {
  shippingAddressId?: string | null;
  paymentMethodId?: string | null;
  couponCode?: string | null;
}

export interface ApplyCouponRequest {
  couponCode: string;
}

export interface OrderListItem {
  id: string;
  status?: string;
  /** Raw payload for debugging / future fields */
  raw?: Record<string, unknown>;
}

export interface UpdateOrderStatusRequest {
  status: string;
  [key: string]: unknown;
}
