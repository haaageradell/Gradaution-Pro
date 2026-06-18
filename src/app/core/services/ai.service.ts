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

  tryOnUploadedPhoto(imageFile: File, product: Product): Observable<Blob> {
    // Resolve the glasses image URL from the product's twoDImageUrl (priority)
    const glassesUrl = this.resolveProductImage(product);

    console.log('[AiService] === TRY-ON REQUEST ===');
    console.log('[AiService] Product:', product.name, '(id:', product.id, ')');
    console.log('[AiService] twoDImageUrl:', product.twoDImageUrl);
    console.log('[AiService] Resolved glassesUrl:', glassesUrl);
    console.log('[AiService] User image file:', imageFile.name, imageFile.type, imageFile.size, 'bytes');

    if (!glassesUrl) {
      console.error('[AiService] No glasses image URL available for product:', product);
      return throwError(() => new Error(
        'The selected glasses product does not have a 2D image. Please select a different product.'
      ));
    }

    const formData = new FormData();
    formData.append('userImage', imageFile, imageFile.name || 'face.jpg');
    formData.append('glassesUrl', glassesUrl);

    const endpoint = `${environment.apiUrl.replace(/\/$/, '')}/api/Ai/try-on`;
    console.log('[AiService] POST endpoint:', endpoint);
    console.log('[AiService] FormData fields: userImage=' + (imageFile.name || 'face.jpg') + ', glassesUrl=' + glassesUrl);

    return this.http.post(endpoint, formData, {
      responseType: 'blob',
    }).pipe(
      tap((blob) => {
        console.log('[AiService] === TRY-ON RESPONSE ===');
        console.log('[AiService] Response blob type:', blob.type, 'size:', blob.size, 'bytes');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[AiService] === TRY-ON ERROR ===');
        console.error('[AiService] Status:', error.status, error.statusText);
        console.error('[AiService] Error object:', error);

        // If error body is a Blob (due to responseType: 'blob'), read it as text
        if (error.error instanceof Blob) {
          error.error.text().then((text: string) => {
            console.error('[AiService] Error response body:', text);
          });
        }

        const message =
          typeof error.error === 'string'
            ? error.error
            : (error.error?.message ??
              error.error?.title ??
              `Try-on request failed (HTTP ${error.status}). Please try again.`);
        return throwError(() => new Error(message));
      }),
    );
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
    // twoDImageUrl is the isolated glasses image required by the AI try-on API
    const twoD = product.twoDImageUrl?.trim() ?? '';
    return (
      twoD ||
      product.imageUrl?.trim() ||
      product.thumbnailUrl?.trim() ||
      ''
    );
  }
}
