/** Cart line as used by cart UI (product row). */
export interface CartLineItem {
  id: string;
  productId: number;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
}

export interface CartCoupon {
  code: string;
  discountAmount: number;
  discountType: 'fixed' | 'percentage';
  isApplied: boolean;
}

export interface CartPriceSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  couponDiscount: number;
  total: number;
}

/** Normalized cart state after GET /api/Cart. */
export interface CartViewModel {
  items: CartLineItem[];
  summary: CartPriceSummary;
  coupon: CartCoupon | null;
  estimatedDelivery?: string;
}
export interface SharedProductCardItem {
  id: number;

  name: string;

  image: string;

  price: number;

  oldPrice?: number;

  rating?: number;
}
