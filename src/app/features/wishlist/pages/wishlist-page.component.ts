import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  finalize,
  map,
  switchMap,
  takeUntil,
} from 'rxjs';
import { BrandService } from '../../../core/services/brand.service';
import {
  WishlistItem,
  WishlistService,
} from '../../../core/services/wishlist.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist-page.component.html',
})
export class WishlistPageComponent implements OnInit, OnDestroy {
  /** When true, hides the page header and outer padding (e.g. embedded in Profile). */
  @Input() embedded = false;

  private readonly wishlistService = inject(WishlistService);
  private readonly brandService = inject(BrandService);
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
      .pipe(
        switchMap((items) =>
          this.brandService
            .getBrandLookupMap()
            .pipe(map((brandMap) => this.enrichWishlistItems(items, brandMap))),
        ),
        takeUntil(this.destroy$),
      )
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

  private enrichWishlistItems(
    items: WishlistItem[],
    brandMap: Map<number, string>,
  ): WishlistItem[] {
    return items.map((item) => {
      if (item.brandName || !item.brandId) {
        return item;
      }

      const brandName = brandMap.get(item.brandId);
      const enriched = brandName ? { ...item, brandName } : item;
      return enriched;
    });
  }

  private isAuthenticated(): boolean {
    return this.isBrowser && Boolean(localStorage.getItem('token')?.trim());
  }
}
