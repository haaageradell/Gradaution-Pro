import { Product } from './product.model';

export interface AnalyzeFaceApiResponse {
  faceShape?: string;
  FaceShape?: string;
  faceShapeDescription?: string;
  FaceShapeDescription?: string;
  analysisDescription?: string;
  AnalysisDescription?: string;
  description?: string;
  Description?: string;
  totalResults?: number;
  TotalResults?: number;
  recommendedProducts?: unknown[];
  RecommendedProducts?: unknown[];
  data?: AnalyzeFaceApiResponse;
  Data?: AnalyzeFaceApiResponse;
}

export interface FaceAnalysisResult {
  faceShape: string;
  faceShapeDescription: string;
  totalResults: number;
  recommendedProducts: Product[];
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function readString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function readNumber(record: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
}

function unwrapPayload(raw: unknown): Record<string, unknown> {
  const record = asRecord(raw);
  if (!Object.keys(record).length) {
    throw new Error('Received an empty response from the face analysis server.');
  }

  const nested = record['data'] ?? record['Data'];
  if (nested !== undefined && nested !== null) {
    return asRecord(nested);
  }

  return record;
}

export function normalizeRecommendedProduct(item: unknown): Product {
  const record = asRecord(item);
  const twoDImageUrl = readString(record, 'twoDImageUrl', 'TwoDImageUrl');
  const thumbnailUrl = readString(record, 'thumbnailUrl', 'ThumbnailUrl');
  const imageUrl =
    readString(record, 'imageUrl', 'ImageUrl', 'image', 'Image') ||
    twoDImageUrl ||
    thumbnailUrl;
  const mediaUrl = readString(record, 'mediaUrl', 'MediaUrl');
  const oldPriceRaw = record['oldPrice'] ?? record['OldPrice'];
  const rating = readNumber(
    record,
    'rating',
    'Rating',
    'averageRating',
    'AverageRating',
  );
  const averageRating = readNumber(
    record,
    'averageRating',
    'AverageRating',
    'rating',
    'Rating',
  );

  const product: Product = {
    id: readNumber(record, 'id', 'Id'),
    name: readString(record, 'name', 'Name'),
    description: readString(record, 'description', 'Description'),
    price: readNumber(record, 'price', 'Price'),
    rating,
    averageRating,
    imageUrl,
    thumbnailUrl,
    brandId: readNumber(record, 'brandId', 'BrandId') || undefined,
    brandName: readString(
      record,
      'brandName',
      'BrandName',
      'brand',
      'Brand',
    ),
    categoryName: readString(
      record,
      'categoryName',
      'CategoryName',
      'category',
      'Category',
    ),
    mediaUrl,
  };

  if (oldPriceRaw !== undefined && oldPriceRaw !== null && oldPriceRaw !== '') {
    product.oldPrice = Number(oldPriceRaw);
  }

  if (twoDImageUrl) {
    product.twoDImageUrl = twoDImageUrl;
  }

  return product;
}

export function normalizeFaceAnalysisResponse(raw: unknown): FaceAnalysisResult {
  const payload = unwrapPayload(raw);

  const faceShape = readString(payload, 'faceShape', 'FaceShape');
  const faceShapeDescription = readString(
    payload,
    'faceShapeDescription',
    'FaceShapeDescription',
    'analysisDescription',
    'AnalysisDescription',
    'description',
    'Description',
  );

  const totalResults = readNumber(payload, 'totalResults', 'TotalResults');
  const rawProducts = payload['recommendedProducts'] ?? payload['RecommendedProducts'];
  const recommendedProducts = Array.isArray(rawProducts)
    ? rawProducts.map((item) => normalizeRecommendedProduct(item))
    : [];

  return {
    faceShape,
    faceShapeDescription,
    totalResults: totalResults || recommendedProducts.length,
    recommendedProducts,
  };
}
