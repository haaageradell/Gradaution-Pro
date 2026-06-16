import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface Review {
  id?: number;
  productId?: number;

  reviewerName?: string;
  userName?: string;

  rating: number;

  reviewText?: string;
  comment?: string;

  title?: string;
  body?: string;

  reviewDate?: string;
  createdAt?: string;
  date?: string;
}

export interface CreateReviewPayload {
  rating: number;
  title: string;
  body: string;
  productId: number;
  orderId: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly reviewApiUrl = `${environment.apiUrl}/api/Review`;

  getReviewsByProductId(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.reviewApiUrl}/${productId}`);
  }

  postReview(payload: CreateReviewPayload): Observable<Review> {
    return this.http.post<Review>(this.reviewApiUrl, payload);
  }
}
