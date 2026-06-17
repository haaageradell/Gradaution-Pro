export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
}

/** POST/PUT /api/Profile/addresses — matches CreateAddressDto (Swagger). */
export interface CreateAddressRequest {
  country: string;
  city: string;
  street: string;
  buildingNo: string;
}

/** Address returned from GET /api/Profile/addresses (id + CreateAddressDto fields). */
export interface UserAddress extends CreateAddressRequest {
  id?: string;
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
