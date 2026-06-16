/** API-aligned order types (camelCase JSON; server may return PascalCase — normalized in services). */

export interface CreateOrderItemRequest {
  productId: number;
  quantity: number;
  price: number;
}

/** POST /api/Order — matches backend CreateOrderDto (Swagger). */
export interface CreateOrderRequest {
  currency?: string | null;
  discount?: number;
  shippingCost?: number;
  estimatedDelivery?: string | null;
  items?: CreateOrderItemRequest[] | null;
  paymentMethodId?: string | null;
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
