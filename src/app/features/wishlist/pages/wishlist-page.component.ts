import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, finalize, takeUntil } from 'rxjs';
import { WishlistItem, WishlistService } from '../../../core/services/wishlist.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist-page.component.html',
})
export class WishlistPageComponent implements OnInit, OnDestroy {
  private readonly wishlistService = inject(WishlistService);
  private readonly toastr = inject(ToastrService);
  private readonly destroy$ = new Subject<void>();
  private readonly isBrowser: boolean;

  wishlistItems: WishlistItem[] = [];
  isLoading = true;
  removingProductId: number | null = null;

  readonly fallbackImage = 'https://picsum.photos/300/300';

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.wishlistService.wishlistItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.wishlistItems = [...items];
      });

    if (!this.isAuthenticated()) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.wishlistService
      .getWishlist()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('[WishlistPage] loadWishlist error:', error);
          this.toastr.error('Could not load wishlist', 'Wishlist', {
            positionClass: 'toast-bottom-right',
          });
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeItem(productId: number): void {
    if (!productId || this.removingProductId === productId) {
      return;
    }

    this.removingProductId = productId;

    this.wishlistService
      .removeFromWishlist(productId)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('[WishlistPage] removeItem error:', error);
          this.toastr.error('Could not remove item from wishlist', 'Wishlist', {
            positionClass: 'toast-bottom-right',
          });
          return EMPTY;
        }),
        finalize(() => {
          this.removingProductId = null;
        }),
      )
      .subscribe({
        next: () => {
          this.toastr.success('Product removed from wishlist', undefined, {
            positionClass: 'toast-bottom-right',
          });
        },
      });
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src = this.fallbackImage;
    }
  }

  private isAuthenticated(): boolean {
    return (
      this.isBrowser && Boolean(localStorage.getItem('token')?.trim())
    );
  }
}
