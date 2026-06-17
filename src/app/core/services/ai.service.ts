import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FaceAnalysisResult,
  normalizeFaceAnalysisResponse,
} from '../models/face-analysis.model';
import { Product } from '../models/product.model';
import { BrandService } from './brand.service';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly brandService = inject(BrandService);
  private readonly analyzeFaceEndpoint = `${environment.apiUrl.replace(/\/$/, '')}/api/Ai/analyze-face`;

  readonly analyzedFaceResult = signal<FaceAnalysisResult | null>(null);
  readonly uploadedImage = signal<string | null>(null);
  readonly selectedGlasses = signal<Product | null>(null);

  tryOnUploadedPhoto(imageFile: File, glassesUrl: string): Observable<Blob> {
    const formData = new FormData();
    formData.append('image', imageFile, imageFile.name || 'face.jpg');
    formData.append('glasses_url', glassesUrl);
    formData.append('glasses', glassesUrl);
    formData.append('twoDImageUrl', glassesUrl);

    return this.http.post('http://51.21.135.52:5000/try-on', formData, {
      responseType: 'blob',
    });
  }

  analyzeFace(imageFile: File): Observable<FaceAnalysisResult> {
    const formData = new FormData();
    formData.append('image', imageFile, imageFile.name || 'face.jpg');

    return this.http.post<unknown>(this.analyzeFaceEndpoint, formData).pipe(
      tap((response) => console.log(response)),
      map((response) => normalizeFaceAnalysisResponse(response)),
      switchMap((result) =>
        this.brandService.enrichProducts(result.recommendedProducts).pipe(
          map((recommendedProducts) => ({
            ...result,
            recommendedProducts,
          })),
        ),
      ),
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
    const twoD = product.twoDImageUrl?.trim() ?? '';
    return (
      product.imageUrl?.trim() ||
      twoD ||
      product.thumbnailUrl?.trim() ||
      ''
    );
  }
}
