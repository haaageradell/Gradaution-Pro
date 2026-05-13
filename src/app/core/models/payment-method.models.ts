<<<<<<< HEAD
/** Client view after normalizing GET /api/PaymentMethod items. */
export interface PaymentMethodView {
  id: string;
  /** Last four digits for display */
  last4: string;
  expiryMonth: number | null;
  expiryYear: number | null;
  /** e.g. visa, mastercard */
  brand: string | null;
  cardHolderName: string | null;
}

/** POST /api/PaymentMethod — field names may vary by backend; extras allowed. */
export interface CreatePaymentMethodRequest {
  cardHolderName: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  saveForFutureCheckout?: boolean;
=======
export interface PaymentMethod {
  id: string;
  cardNumber: string;
  expiryDate: string;
  cardHolder?: string;
  cardType?: string;
}

export interface CreatePaymentMethodRequest {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

export interface ShippingAddress {
  id: string;
  name: string;
  addressLine: string;
  contact: string;
  type: 'Home' | 'Office';
  isDefault?: boolean;
>>>>>>> 905b30e6a8ccd2984b861c9225c4c94d639fe078
}
