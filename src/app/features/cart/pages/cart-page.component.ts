import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, EMPTY, finalize, switchMap } from 'rxjs';
import {
  CartCoupon,
  CartLineItem,
  CartPriceSummary,
} from '../../../core/models/cart.models';
import { CartService } from '../../../core/services/cart.service';
import { CartItemComponent } from '../components/cart-item.component';
import { OrderSummaryComponent } from '../components/order-summary.component';
import { SimilarProductsComponent } from '../../products/components/similar-products.component';
import { SharedProductCardItem } from '../../../shared/components/product-card.component';
import { ProductService } from '../../../core/services/product.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    CartItemComponent,
    OrderSummaryComponent,
    SimilarProductsComponent,
  ],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.css',
})
export class CartPageComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly isBrowser: boolean;
  private readonly productService = inject(ProductService);
  private readonly toastr = inject(ToastrService);

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  coupon: CartCoupon | null = null;
  estimatedDelivery = '3-5 Business Days';
  cartItems: CartLineItem[] = [];
  summary: CartPriceSummary = {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    couponDiscount: 0,
    total: 0,
  };
  couponMessage = '';
  isLoading = true;

  similarProducts: SharedProductCardItem[] = [];

  ngOnInit(): void {
    if (this.isBrowser) {
      // console.log('[CartPage] init token:', localStorage.getItem('token'));

      this.getCart();
    } else {
      console.log('[CartPage] init on server');
    }
  }

  //
  private loadSimilarProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        const products = Array.isArray(response)
          ? response
          : (response.data ?? []);

        this.similarProducts = products

          // استبعاد المنتجات الموجودة في الكارت
          .filter(
            (product) =>
              !this.cartItems.some(
                (cartItem) => cartItem.productId === product.id,
              ),
          )

          // عدد المنتجات
          .slice(0, 6)

          // تحويل الشكل للكارد
          .map((product) => ({
            id: product.id,

            name: product.name,

            image:
              product.thumbnailUrl && product.thumbnailUrl.trim() !== ''
                ? product.thumbnailUrl
                : 'https://picsum.photos/300/300',

            price: product.price,

            oldPrice: product.price + 500,

            rating: product.averageRating || 0,
          }));

        // console.log('SIMILAR PRODUCTS:', this.similarProducts);
      },

      error: (error) => {
        console.error('Failed to load similar products', error);
      },
    });
  }
  //

  onQuantityChange(itemId: string, change: number): void {
    const target = this.cartItems.find((item) => item.id === itemId);
    if (!target) {
      return;
    }
    const newQty = Math.max(1, target.quantity + change);
    this.cartService.updateCartCountFromItems(this.cartItems);
    if (newQty === target.quantity) {
      return;
    }
    this.cartService
      .updateCartItem(itemId, { quantity: newQty })
      .pipe(
        switchMap(() =>
          this.cartService.getCart().pipe(
            catchError((err: HttpErrorResponse) => {
              console.error('[CartPage] getCart after update error:', err);
              return EMPTY;
            }),
          ),
        ),
        catchError((error: HttpErrorResponse) => {
          console.error('[CartPage] updateCartItem error:', error);
          return EMPTY;
        }),
      )
      .subscribe({
        next: (cart) => {
          this.toastr.success(
            `${target.productName} quantity updated`,
            'Cart Updated',
            {
              positionClass: 'toast-bottom-right',
            },
          );
          console.log('[CartPage] cart after quantity update:', cart);
          this.applyCartView(cart);
        },
      });
  }
  removeItem(itemId: string): void {
    const removedItem = this.cartItems.find((item) => item.id === itemId);

    this.cartService
      .removeCartItem(itemId)

      .pipe(switchMap(() => this.cartService.getCart()))

      .subscribe({
        next: (cart) => {
          this.applyCartView(cart);

          this.toastr.warning(
            `${removedItem?.productName} removed from cart`,
            'Removed',
            {
              positionClass: 'toast-bottom-right',
            },
          );
        },
      });
  }
  applyCoupon(code: string): void {
    console.log(
      '[CartPage] applyCoupon (no dedicated Cart coupon route in spec):',
      code,
    );
    this.couponMessage =
      'Promotional codes are applied at checkout when your backend supports them.';
  }

  proceedToCheckout(): void {
    this.router.navigateByUrl('/checkout');
  }

  private getCart(): void {
    this.isLoading = true;
    this.cartService
      .getCart()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('[CartPage] getCart error:', error);
          this.resetCartState();
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (cart) => {
          // console.log('[CartPage] getCart response:', cart);
          this.applyCartView(cart);
        },
      });
  }

  private applyCartView(cart: {
    items: CartLineItem[];
    summary: CartPriceSummary;
    coupon: CartCoupon | null;
    estimatedDelivery?: string;
  }): void {
    this.cartItems = [...cart.items];
    this.cartService.updateCartCountFromItems(this.cartItems);
    this.summary = { ...cart.summary };

    this.coupon = cart.coupon;

    this.estimatedDelivery = cart.estimatedDelivery ?? '3-5 Business Days';

    this.couponMessage = this.coupon?.isApplied
      ? `Coupon "${this.coupon.code}" applied successfully.`
      : '';

    this.loadSimilarProducts();

    this.recalculateSummary();
  }

  private resetCartState(): void {
    this.coupon = null;
    this.cartItems = [];
    this.similarProducts = [];
    this.summary = {
      subtotal: 0,
      discount: 0,
      shipping: 0,
      couponDiscount: 0,
      total: 0,
    };
  }

  private recalculateSummary(): void {
    const subtotal = this.cartItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const discount = this.summary.discount;
    const shipping = this.summary.shipping;
    const couponDiscount = this.summary.couponDiscount;

    this.summary = {
      subtotal,
      discount,
      shipping,
      couponDiscount,
      total: Math.max(0, subtotal - discount - couponDiscount + shipping),
    };
  }
}
