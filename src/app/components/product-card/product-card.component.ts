import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, Subject, catchError, finalize, takeUntil } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';

export interface ProductItem {
  id: number;
  name: string;
  price: number;
  oldPrice: number;
  rating: number;
  image: string;
  mediaUrl?: string;
  twoDImageUrl?: string;
  brandId?: number;
  brandName?: string;
}

@Component({
  selector: 'app-shared-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent implements OnInit, OnDestroy {
  @Input({ required: true }) product!: ProductItem;

  private readonly cartService = inject(CartService);
  private readonly toastr = inject(ToastrService);
  public readonly router = inject(Router);
  private readonly wishlistService = inject(WishlistService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroy$ = new Subject<void>();

  wished = false;
  isAdding = false;
  isTogglingWishlist = false;

  readonly fallbackImage = 'https://picsum.photos/200';

  get stars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  ngOnInit(): void {
    this.wishlistService.wishlistItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.syncWishlistState();
      });

    if (this.isAuthenticated()) {
      this.wishlistService.ensureLoaded();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleWishlist(): void {
    if (!this.product?.id || this.isTogglingWishlist) {
      return;
    }

    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.isTogglingWishlist = true;
    const productId = this.product.id;
    const wasInWishlist = this.wished;
    const request$ = wasInWishlist
      ? this.wishlistService.removeFromWishlist(productId)
      : this.wishlistService.addToWishlist(productId, {
          name: this.product.name,
          price: this.product.price,
          oldPrice: this.product.oldPrice,
          image: this.product.image,
          rating: this.product.rating,
        });

    request$
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('[ProductCard] toggleWishlist error:', error);
          this.toastr.error('Could not update wishlist', undefined, {
            positionClass: 'toast-bottom-left',
          });
          return EMPTY;
        }),
        finalize(() => {
          this.isTogglingWishlist = false;
        }),
      )
      .subscribe({
        next: () => {
          this.syncWishlistState();
          if (wasInWishlist) {
            this.toastr.success('Product removed from wishlist', undefined, {
              positionClass: 'toast-bottom-left',
            });
          } else {
            this.toastr.success('Product added to wishlist ❤️', undefined, {
              positionClass: 'toast-bottom-left',
            });
          }
        },
      });
  }

  private syncWishlistState(): void {
    this.wished = this.wishlistService.isInWishlist(this.product?.id);
  }

  private isAuthenticated(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      Boolean(localStorage.getItem('token')?.trim())
    );
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;

    if (target) {
      target.src = this.fallbackImage;
    }
  }

  addToCart(): void {
    if (!this.product?.id || this.isAdding) {
      return;
    }

    this.isAdding = true;

    const body = {
      productId: this.product.id,
      quantity: 1,
    };

    this.cartService.addToCart(body).subscribe({
      next: (response) => {
        this.cartService.getCart().subscribe({
          next: (cart) => {
            this.cartService.updateCartCountFromItems(cart.items);
          },
        });

        this.toastr.success(`${this.product.name} added to cart`, 'Success', {
          positionClass: 'toast-bottom-left',
        });
        this.isAdding = false;
      },
      error: (error) => {
        console.error('Add to cart error:', error);
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
}
