export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
}

export interface UserAddress {
  id?: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  street: string;
  building: string;
  isDefault: boolean;
}

export interface OrderPlaceholder {
  orderNumber: string;
  date: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  totalPrice: number;
}

export interface WishlistPlaceholder {
  id: string;
  productName: string;
  price: number;
  productImage: string;
}

export interface PaymentMethodPlaceholder {
  id: string;
  brand: 'Visa' | 'Mastercard' | 'Unknown';
  last4: string;
  cardHolderName: string;
}

export interface UserSettings {
  darkMode: boolean;
  notificationsEnabled: boolean;
  language: 'en' | 'ar' | 'fr';
}
