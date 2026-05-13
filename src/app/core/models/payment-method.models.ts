export interface PaymentMethodView {
  id: string;
  last4: string;
  expiryMonth: number | null;
  expiryYear: number | null;
  brand: string | null;
  cardHolderName: string | null;
}

export interface CreatePaymentMethodRequest {
  cardHolderName: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  saveForFutureCheckout?: boolean;
}

export interface ShippingAddress {
  id: string;
  name: string;
  addressLine: string;
  contact: string;
  type: 'Home' | 'Office';
  isDefault?: boolean;
}
