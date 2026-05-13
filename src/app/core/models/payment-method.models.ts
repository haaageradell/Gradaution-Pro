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
}
