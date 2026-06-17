/** @deprecated Import from `order.model` instead. Kept for backward compatibility. */
export type {
  ApplyCouponRequest,
  CreateOrderItemRequest,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
} from './order.model';

/** @deprecated Use `OrderSummary` from `order.model` instead. */
export interface OrderListItem {
  id: string;
  status?: string;
  raw?: Record<string, unknown>;
}
