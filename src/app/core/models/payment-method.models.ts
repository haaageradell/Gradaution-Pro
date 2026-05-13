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
}
