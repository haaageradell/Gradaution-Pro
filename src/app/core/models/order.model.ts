/** UI/domain models for orders — normalized from API responses. */

export type OrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | string;

export const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export interface OrderLineItem {
  id: string;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderShippingDetails {
  recipientName: string;
  badge?: string;
  lines: string[];
  phone: string;
  formattedAddress: string;
}

export interface OrderPaymentDetails {
  methodId: string;
  methodLabel: string;
  brand?: string;
  last4?: string;
}

export interface OrderPriceSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  couponDiscount: number;
  total: number;
  currency: string;
}

/** List card / summary row */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderDate: string | null;
  totalAmount: number;
  paymentMethod: string;
  itemCount: number;
  shippingAddress: string;
  currency: string;
}

/** Full order from GET /api/Order/{orderId} */
export interface OrderDetail extends OrderSummary {
  items: OrderLineItem[];
  summary: OrderPriceSummary;
  shipping: OrderShippingDetails;
  payment: OrderPaymentDetails;
  estimatedDelivery: string | null;
}

export interface OrderStatusCounts {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface OrderProfileStats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  currency: string;
}

export interface CreateOrderItemRequest {
  productId: number;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  currency?: string | null;
  discount?: number;
  shippingCost?: number;
  estimatedDelivery?: string | null;
  items?: CreateOrderItemRequest[] | null;
  paymentMethodId?: string | null;
  subtotal?: number;
  total?: number;
  couponDiscount?: number;
  shippingAddress?: {
    name: string;
    badge?: string;
    lines: string[];
    phone: string;
  } | null;
}

export interface ApplyCouponRequest {
  couponCode: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
  [key: string]: unknown;
}

export function normalizeOrderStatus(raw: unknown): OrderStatus {
  const value = String(raw ?? 'Pending').trim();
  if (!value) {
    return 'Pending';
  }
  const lower = value.toLowerCase();
  const match = ORDER_STATUSES.find((s) => s.toLowerCase() === lower);
  if (match) {
    return match;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function orderStatusBadgeClass(status: OrderStatus): string {
  switch (normalizeOrderStatus(status)) {
    case 'Delivered':
      return 'order-status--delivered';
    case 'Shipped':
      return 'order-status--shipped';
    case 'Processing':
      return 'order-status--processing';
    case 'Pending':
      return 'order-status--pending';
    case 'Cancelled':
      return 'order-status--cancelled';
    default:
      return 'order-status--default';
  }
}
