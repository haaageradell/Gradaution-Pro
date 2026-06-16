export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  oldPrice?: number;
  averageRating?: number;
  rating?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  twoDImageUrl?: string;
  categoryId?: number;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  color?: string;
  gender?: string;
  size?: string;
  stockQuantity?: number;
  isActive?: boolean;
  mediaUrl?: string;
}

export interface ProductsApiResponse {
  data?: Product[];
  totalCount?: number;
}
export interface SharedProductCardItem {
  id: number;

  name: string;

  image: string;

  price: number;

  oldPrice?: number;

  rating?: number;
}
