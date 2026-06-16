export interface PaymentMethodView {
  id: string;
  last4: string;
  expiryMonth: number | null;
  expiryYear: number | null;
  brand: string | null;
  cardHolderName: string | null;
}

/** POST /api/PaymentMethod — matches backend CreatePaymentMethodDto (Swagger). */
export interface CreatePaymentMethodRequest {
  provider?: string | null;
  lastDigits?: string | null;
  expireDate?: string | null;
  isDefault?: boolean;
}

export interface ShippingAddress {
  id: string;
  name: string;
  addressLine: string;
  contact: string;
  type: 'Home' | 'Office';
  isDefault?: boolean;
}
