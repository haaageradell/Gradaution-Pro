import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, of, switchMap, takeUntil, finalize } from 'rxjs';
import {
  ProductCardComponent,
  ProductItem,
} from '../../components/product-card/product-card.component';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { BrandService } from '../../core/services/brand.service';
import {
  ReviewService,
  Review,
  CreateReviewPayload,
} from '../../core/services/review.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ToastrService } from 'ngx-toastr';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly brandService = inject(BrandService);
  private readonly reviewService = inject(ReviewService);
  private readonly wishlistService = inject(WishlistService);
  private readonly toastr = inject(ToastrService);
  private readonly destroy$ = new Subject<void>();
  private readonly cartService = inject(CartService);
  private readonly ToastrService = inject(ToastrService);

  isAdding = false;
  private currentProductId = 0;
  // Product state
  product: Product | null = null;
  isLoadingProduct = true;
  productError = '';

  // Reviews state
  reviews: Review[] = [];
  isLoadingReviews = false;
  reviewsError = '';

  // Similar products state
  similarProducts: ProductItem[] = [];
  isLoadingSimilar = false;
  similarError = '';

  // UI state
  selectedImageIndex = 0;
  quantity = 1;
  isWishlisted = false;

  // Review form state
  selectedRating = 0;
  hoverRating = 0;
  reviewText = '';
  reviewTitle = '';
  isSubmittingReview = false;
  submitError = '';

  // Accordion state
  descriptionOpen = true;
  dimensionsOpen = false;
  reviewsOpen = true;

  // Computed thumbnails: always use thumbnailUrl for all 4 slots
  get thumbnails(): string[] {
    const url = this.product?.thumbnailUrl || '';
    return [url, url, url, url];
  }

  get mainImage(): string {
    return this.product?.thumbnailUrl || '';
  }

  get starsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  get averageRatingDisplay(): string {
    return (this.product?.averageRating ?? 0).toFixed(1);
  }

  get reviewsRatingStats(): {
    stars: number;
    count: number;
    percentage: number;
  }[] {
    const counts = [0, 0, 0, 0, 0];
    for (const r of this.reviews) {
      const s = Math.round(r.rating ?? 0);
      if (s >= 1 && s <= 5) {
        counts[s - 1]++;
      }
    }
    const total = this.reviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      stars: star,
      count: counts[star - 1],
      percentage: Math.round((counts[star - 1] / total) * 100),
    }));
  }

  get overallRating(): number {
    if (!this.reviews.length) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    return sum / this.reviews.length;
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) {
        this.productError = 'Invalid product ID.';
        this.isLoadingProduct = false;
        return;
      }
      this.currentProductId = id;
      this.loadAll(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAll(id: number): void {
    this.isLoadingProduct = true;
    this.isLoadingReviews = true;
    this.isLoadingSimilar = true;
    this.productError = '';
    this.reviewsError = '';
    this.similarError = '';

    // Load product
    this.productService
      .getProductById(id)
      .pipe(
        switchMap((product) =>
          product ? this.brandService.enrichProduct(product) : of(null),
        ),
        catchError((err: HttpErrorResponse) => {
          this.productError = 'Failed to load product. Please try again.';
          this.isLoadingProduct = false;
          return of(null);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((product) => {
        if (product) {
          this.product = product;
        }
        this.isLoadingProduct = false;
      });

    // Load reviews
    this.loadReviews(id);

    // Load similar products
    this.productService
      .getSimilarProducts(id)
      .pipe(
        switchMap((products) =>
          this.brandService.enrichProducts(products ?? []),
        ),
        catchError((err: HttpErrorResponse) => {
          this.similarError = 'Failed to load similar products.';
          return of([]);
        }),
        finalize(() => {
          this.isLoadingSimilar = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((products) => {
        this.similarProducts = products.map((p) => this.mapToCardItem(p));
      });
  }

  // ── Review helpers ──────────────────────────────────────────

  private loadReviews(productId: number): void {
    this.isLoadingReviews = true;
    this.reviewsError = '';
    this.reviewService
      .getReviewsByProductId(productId)
      .pipe(
        catchError(() => {
          this.reviewsError = 'Failed to load reviews.';
          return of([]);
        }),
        finalize(() => {
          this.isLoadingReviews = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((reviews) => {
        this.reviews = reviews ?? [];
      });
  }

  setRating(star: number): void {
    this.selectedRating = star;
  }

  setHoverRating(star: number): void {
    this.hoverRating = star;
  }

  clearHoverRating(): void {
    this.hoverRating = 0;
  }

  isStarActive(star: number): boolean {
    return star <= (this.hoverRating || this.selectedRating);
  }

  submitReview(): void {
    this.submitError = '';

    if (this.selectedRating < 1) {
      this.submitError = 'Please select a star rating before submitting.';
      return;
    }
    if (!this.reviewText.trim()) {
      this.submitError = 'Please write a review before submitting.';
      return;
    }
    if (!this.currentProductId) {
      return;
    }

    const payload: CreateReviewPayload = {
      rating: this.selectedRating,
      title: 'Product Review',
      body: this.reviewText.trim(),
      productId: this.currentProductId,
      orderId: 1,
    };

    this.isSubmittingReview = true;

    this.reviewService
      .postReview(payload)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const msg =
            err.error?.message ||
            err.error?.title ||
            'Failed to submit review. Please try again.';
          this.submitError = msg;
          this.isSubmittingReview = false;
          return of(null);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((result) => {
        if (result !== null) {
          this.reviewText = '';
          this.reviewTitle = '';
          this.selectedRating = 0;
          this.hoverRating = 0;
          this.submitError = '';
          this.toastr.success('Review submitted successfully!', undefined, {
            positionClass: 'toast-bottom-left',
          });
          this.loadReviews(this.currentProductId);
        }
        this.isSubmittingReview = false;
      });
  }

  // ── Image / Qty ──────────────────────────────────────────────

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  incrementQty(): void {
    const max = this.product?.stockQuantity ?? 99;
    if (this.quantity < max) {
      this.quantity++;
    }
  }

  decrementQty(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  toggleWishlist(): void {
    if (!this.product) return;

    const productId = this.product.id;

    if (this.isWishlisted) {
      this.wishlistService.removeFromWishlist(productId).subscribe();

      this.isWishlisted = false;
    } else {
      this.wishlistService
        .addToWishlist(productId, {
          name: this.product.name,
          price: this.product.price,
          oldPrice: this.product.price,
          image: this.product.thumbnailUrl,
          rating: this.product.averageRating ?? 0,
        })
        .subscribe();

      this.isWishlisted = true;
    }
  }
  toggleDescription(): void {
    this.descriptionOpen = !this.descriptionOpen;
  }

  toggleDimensions(): void {
    this.dimensionsOpen = !this.dimensionsOpen;
  }

  toggleReviews(): void {
    this.reviewsOpen = !this.reviewsOpen;
  }

  getReviewerName(review: Review): string {
    return review.reviewerName || review.userName || 'Anonymous';
  }

  getReviewText(review: Review): string {
    return review.body || review.reviewText || review.comment || '';
  }

  getReviewDate(review: Review): string {
    const raw = review.reviewDate || review.createdAt || review.date || '';
    if (!raw) return '';
    try {
      return new Date(raw).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return raw;
    }
  }

  getReviewerInitials(review: Review): string {
    const name = this.getReviewerName(review);
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getFilledStars(rating: number): number[] {
    const filled = Math.round(rating ?? 0);
    return Array.from({ length: filled }, (_, i) => i);
  }

  getEmptyStars(rating: number): number[] {
    const filled = Math.round(rating ?? 0);
    return Array.from({ length: 5 - filled }, (_, i) => i);
  }

  navigateBack(): void {
    this.router.navigate(['/products']);
  }
  addToCart(): void {
    if (!this.product) return;

    this.isAdding = true;

    const body = {
      productId: this.product.id,
      quantity: this.quantity,
    };

    this.cartService.addToCart(body).subscribe({
      next: (response) => {
        this.cartService.getCart().subscribe({
          next: (cart: any) => {
            this.cartService.updateCartCountFromItems(cart.items);
          },
        });

        this.toastr.success(`${this.product?.name} added to cart`, 'Success', {
          positionClass: 'toast-bottom-left',
        });

        this.isAdding = false;
      },

      error: (error) => {
        this.isAdding = false;
      },
    });
  }

  tryOn(): void {
    if (!this.product?.id) {
      return;
    }

    this.router.navigate(['/try'], {
      queryParams: {
        id: this.product.id,
        mediaUrl: this.product.mediaUrl || '',
      },
      state: {
        product: this.product,
        productId: this.product.id,
        mediaUrl: this.product.mediaUrl || '',
      },
    });
  }

  private mapToCardItem(product: Product): ProductItem {
    const image =
      product.thumbnailUrl?.trim() ||
      product.imageUrl?.trim() ||
      'https://picsum.photos/200';
    return {
      id: product.id ?? 0,
      name: product.name ?? 'Unnamed Product',
      price: product.price ?? 0,
      oldPrice: product.oldPrice ?? product.price ?? 0,
      rating: product.averageRating ?? product.rating ?? 0,
      image,
      mediaUrl: product.mediaUrl || '',
      twoDImageUrl: product.twoDImageUrl || '',
      brandId: product.brandId,
      brandName: product.brandName,
    };
  }
}
