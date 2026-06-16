import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WishlistItem {
  productId: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating?: number;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/Wishlist`;
  private readonly wishlistItemsSubject = new BehaviorSubject<WishlistItem[]>([]);
  private loadRequest$: Observable<WishlistItem[]> | null = null;
  private hasLoadedSuccessfully = false;

  wishlistItems$ = this.wishlistItemsSubject.asObservable();

  getWishlist(): Observable<WishlistItem[]> {
    if (!this.canLoadWishlist()) {
      return throwError(
        () =>
          new Error(
            '[WishlistService] getWishlist skipped: not browser or not authenticated',
          ),
      );
    }

    return this.http.get<unknown>(this.baseUrl).pipe(
      map((raw) => normalizeWishlistList(raw)),
      tap((items) => {
        this.wishlistItemsSubject.next(items);
        this.hasLoadedSuccessfully = true;
      }),
      catchError((err) => {
        console.error('[WishlistService] getWishlist error:', err);
        return throwError(() => err);
      }),
    );
  }

  addToWishlist(
    productId: number,
    product?: Partial<WishlistItem>,
  ): Observable<unknown> {
    const url = `${this.baseUrl}/${encodeURIComponent(productId)}`;
    return this.http.post<unknown>(url, {}).pipe(
      tap(() => this.addLocalItem(productId, product)),
      catchError((err) => {
        console.error('[WishlistService] addToWishlist error:', err);
        return throwError(() => err);
      }),
    );
  }

  removeFromWishlist(productId: number): Observable<unknown> {
    const url = `${this.baseUrl}/${encodeURIComponent(productId)}`;
    return this.http.delete<unknown>(url).pipe(
      tap(() => this.removeLocalItem(productId)),
      catchError((err) => {
        console.error('[WishlistService] removeFromWishlist error:', err);
        return throwError(() => err);
      }),
    );
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistItemsSubject
      .getValue()
      .some((item) => item.productId === productId);
  }

  ensureLoaded(): void {
    if (!this.canLoadWishlist()) {
      return;
    }

    if (this.hasLoadedSuccessfully || this.loadRequest$) {
      return;
    }

    this.loadRequest$ = this.getWishlist().pipe(
      shareReplay(1),
      finalize(() => {
        this.loadRequest$ = null;
      }),
    );

    this.loadRequest$.subscribe({
      error: () => {
        this.wishlistItemsSubject.next([]);
      },
    });
  }

  private canLoadWishlist(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      Boolean(localStorage.getItem('token')?.trim())
    );
  }

  private addLocalItem(
    productId: number,
    product?: Partial<WishlistItem>,
  ): void {
    if (this.isInWishlist(productId)) {
      return;
    }

    const items = [...this.wishlistItemsSubject.getValue()];
    items.push({
      productId,
      name: product?.name ?? '',
      price: product?.price ?? 0,
      oldPrice: product?.oldPrice,
      image: product?.image ?? '',
      rating: product?.rating,
    });
    this.wishlistItemsSubject.next(items);
  }

  private removeLocalItem(productId: number): void {
    const items = this.wishlistItemsSubject
      .getValue()
      .filter((item) => item.productId !== productId);
    this.wishlistItemsSubject.next(items);
  }
}

function normalizeWishlistList(raw: unknown): WishlistItem[] {
  const list = extractArray(raw);
  return list.map((row) => mapWishlistItem(row));
}

function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  const root = raw as Record<string, unknown>;
  const wrapped = unwrapPayload(root);
  for (const key of [
    'items',
    'Items',
    'products',
    'Products',
    'wishlistItems',
    'WishlistItems',
    'data',
    'Data',
  ]) {
    const v = wrapped[key];
    if (Array.isArray(v)) {
      return v;
    }
  }
  return [];
}

function unwrapPayload(obj: Record<string, unknown>): Record<string, unknown> {
  for (const key of ['data', 'Data', 'result', 'Result', 'value', 'Value']) {
    const inner = obj[key];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
  }
  return obj;
}

function mapWishlistItem(row: unknown): WishlistItem {
  if (!row || typeof row !== 'object') {
    return {
      productId: 0,
      name: '',
      price: 0,
      image: '',
    };
  }

  const o = row as Record<string, unknown>;
  const nestedProduct = o['product'] ?? o['Product'];
  const product =
    nestedProduct && typeof nestedProduct === 'object'
      ? (nestedProduct as Record<string, unknown>)
      : o;

  const productId = Number(
    o['productId'] ??
      o['ProductId'] ??
      product['id'] ??
      product['Id'] ??
      0,
  );
  const name = String(
    product['name'] ??
      product['Name'] ??
      product['productName'] ??
      product['ProductName'] ??
      '',
  );
  const price = Number(
    product['price'] ?? product['Price'] ?? product['unitPrice'] ?? 0,
  );
  const oldPriceRaw = product['oldPrice'] ?? product['OldPrice'];
  const oldPrice =
    oldPriceRaw != null && Number.isFinite(Number(oldPriceRaw))
      ? Number(oldPriceRaw)
      : undefined;
  const image = String(
    product['thumbnailUrl'] ??
      product['ThumbnailUrl'] ??
      product['imageUrl'] ??
      product['ImageUrl'] ??
      product['image'] ??
      product['Image'] ??
      product['productImage'] ??
      product['ProductImage'] ??
      '',
  );
  const ratingRaw =
    product['rating'] ??
    product['Rating'] ??
    product['averageRating'] ??
    product['AverageRating'];
  const rating =
    ratingRaw != null && Number.isFinite(Number(ratingRaw))
      ? Number(ratingRaw)
      : undefined;

  return {
    productId,
    name,
    price,
    oldPrice,
    image,
    rating,
  };
}
