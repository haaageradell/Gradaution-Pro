import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';

export interface FaceAnalysisResult {
  faceShape: string;
  totalResults: number;
  recommendedProducts: Product[];
}

interface AnalyzeFaceApiResponse {
  faceShape?: string;
  FaceShape?: string;
  totalResults?: number;
  TotalResults?: number;
  recommendedProducts?: unknown[];
  RecommendedProducts?: unknown[];
  data?: AnalyzeFaceApiResponse;
  Data?: AnalyzeFaceApiResponse;
}

@Injectable({
  providedIn: 'root',
})
export class AiFaceAnalysisService {
  private readonly endpoint = `${environment.apiUrl}/api/Ai/analyze-face`;

  readonly analyzedFaceResult = signal<FaceAnalysisResult | null>(null);
  readonly uploadedImage = signal<string | null>(null);
  readonly selectedGlasses = signal<Product | null>(null);

  constructor(private readonly http: HttpClient) { }

  tryOnUploadedPhoto(imageFile: File, glassesUrl: string): Observable<Blob> {
    const formData = new FormData();
    formData.append('image', imageFile, imageFile.name || 'face.jpg');
    formData.append('glasses_url', glassesUrl);
    formData.append('glasses', glassesUrl);
    formData.append('twoDImageUrl', glassesUrl);

    return this.http.post('http://51.21.135.52:5000/try-on', formData, { responseType: 'blob' });
  }

  analyzeFace(imageFile: File): Observable<FaceAnalysisResult> {
    const formData = new FormData();
    formData.append('image', imageFile, imageFile.name || 'face.jpg');

    return this.http.post<AnalyzeFaceApiResponse>(this.endpoint, formData).pipe(
      map((response) => this.mapApiResponse(response)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return throwError(
            () =>
              new Error(
                'You must be logged in to use AI face analysis. Please sign in and try again.',
              ),
          );
        }

        const serverMessage =
          typeof error.error === 'string'
            ? error.error
            : (error.error?.message ??
              error.error?.title ??
              error.message ??
              'Face analysis failed. Please try another photo.');

        return throwError(() => new Error(serverMessage));
      }),
    );
  }

  setTryOnState(
    result: FaceAnalysisResult,
    imageUrl: string,
    glassesProduct: Product | null,
  ): void {
    this.analyzedFaceResult.set(result);
    this.uploadedImage.set(imageUrl);
    this.selectedGlasses.set(glassesProduct);
  }

  clearTryOnState(): void {
    this.analyzedFaceResult.set(null);
    this.uploadedImage.set(null);
    this.selectedGlasses.set(null);
  }

  resolveProductImage(product: Product): string {
    const twoD =
      (product as Product & { twoDImageUrl?: string }).twoDImageUrl?.trim() ?? '';
    return (
      product.imageUrl?.trim() ||
      twoD ||
      product.thumbnailUrl?.trim() ||
      ''
    );
  }

  private mapApiResponse(response: AnalyzeFaceApiResponse | null | undefined): FaceAnalysisResult {
    if (!response) {
      throw new Error('Received an empty response from the face analysis server.');
    }

    const payload = (response.data ?? response.Data ?? response) as AnalyzeFaceApiResponse;

    const faceShape = String(
      payload.faceShape ?? payload.FaceShape ?? 'Unknown',
    ).trim();

    const totalResults = Number(
      payload.totalResults ?? payload.TotalResults ?? 0,
    );

    const rawProducts =
      payload.recommendedProducts ??
      payload.RecommendedProducts ??
      [];

    const recommendedProducts = (Array.isArray(rawProducts) ? rawProducts : []).map(
      (item) => this.mapProduct(item),
    );

    return {
      faceShape,
      totalResults: totalResults || recommendedProducts.length,
      recommendedProducts,
    };
  }

  private mapProduct(item: unknown): Product {
    const record = (item ?? {}) as Record<string, unknown>;
    const twoDImageUrl = String(
      record['twoDImageUrl'] ?? record['TwoDImageUrl'] ?? '',
    );
    const thumbnailUrl = String(
      record['thumbnailUrl'] ?? record['ThumbnailUrl'] ?? '',
    );
    const imageUrl = String(
      record['imageUrl'] ??
      record['ImageUrl'] ??
      record['image'] ??
      record['Image'] ??
      twoDImageUrl ??
      thumbnailUrl ??
      '',
    );

    return {
      id: Number(record['id'] ?? record['Id'] ?? 0),
      name: String(record['name'] ?? record['Name'] ?? 'Glasses Frame'),
      description: String(record['description'] ?? record['Description'] ?? ''),
      price: Number(record['price'] ?? record['Price'] ?? 0),
      oldPrice:
        record['oldPrice'] ?? record['OldPrice']
          ? Number(record['oldPrice'] ?? record['OldPrice'])
          : undefined,
      rating: Number(
        record['rating'] ??
        record['Rating'] ??
        record['averageRating'] ??
        record['AverageRating'] ??
        0,
      ),
      averageRating: Number(
        record['averageRating'] ?? record['AverageRating'] ?? record['rating'] ?? 0,
      ),
      imageUrl,
      thumbnailUrl,
      brandName: String(
        record['brandName'] ?? record['BrandName'] ?? record['brand'] ?? '',
      ),
      categoryName: String(
        record['categoryName'] ??
        record['CategoryName'] ??
        record['category'] ??
        '',
      ),
      ...(twoDImageUrl ? { twoDImageUrl } : {}),
    } as Product;
  }
}
