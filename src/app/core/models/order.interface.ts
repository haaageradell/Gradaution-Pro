export interface OrderItem {
  id: string;
  productId: number;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
}

export interface Coupon {
  code: string;
  discountAmount: number;
  discountType: 'fixed' | 'percentage';
  isApplied: boolean;
}

export interface PriceSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  couponDiscount: number;
  total: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  status: string;
  summary: PriceSummary;
  coupon?: Coupon | null;
  estimatedDelivery?: string;
}
