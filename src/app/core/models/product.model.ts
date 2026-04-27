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
  categoryId?: number;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  color?: string;
  gender?: string;
  size?: string;
  stockQuantity?: number;
  isActive?: boolean;
}

export interface ProductsApiResponse {
  data?: Product[];
  totalCount?: number;
}
