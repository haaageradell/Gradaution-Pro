import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, of, switchMap } from 'rxjs';
import {
  Order,
  OrderItem,
  PriceSummary,
} from '../../../core/models/order.interface';
import { OrderService } from '../../../core/services/order.service';
import { CartItemComponent } from '../components/cart-item.component';
import { OrderSummaryComponent } from '../components/order-summary.component';
import { SimilarProductsComponent } from '../../products/components/similar-products.component';
import { SharedProductCardItem } from '../../../shared/components/product-card.component';

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
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  order: Order | null = null;
  orderId = '';
  cartItems: OrderItem[] = [];
  summary: PriceSummary = {
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
      console.log('[CartPage] init token:', localStorage.getItem('token'));
    } else {
      console.log('[CartPage] init on server');
    }
    this.loadCurrentOrder();
  }

  onQuantityChange(itemId: string, change: number): void {
    const target = this.cartItems.find((item) => item.id === itemId);
    if (!target) {
      return;
    }
    target.quantity = Math.max(1, target.quantity + change);
    this.recalculateSummary();
  }

  removeItem(itemId: string): void {
    this.cartItems = this.cartItems.filter((item) => item.id !== itemId);
    this.recalculateSummary();
  }

  applyCoupon(code: string): void {
    if (!this.orderId) {
      return;
    }

    this.orderService.applyCoupon(this.orderId, code).subscribe({
      next: (updatedOrder) => {
        console.log('[CartPage] applyCoupon response:', updatedOrder);
        this.order = updatedOrder;
        this.syncOrderState(updatedOrder);
      },
      error: (error: HttpErrorResponse) => {
        console.error('[CartPage] applyCoupon error:', error);
        this.couponMessage = 'Coupon is not valid.';
      },
    });
  }

  proceedToCheckout(): void {
    this.router.navigateByUrl('/checkout');
  }

  private loadCurrentOrder(): void {
    this.isLoading = true;
    this.orderService
      .getCurrentOrder()
      .pipe(
        switchMap((order) => {
          console.log('[CartPage] getCurrentOrder response:', order);
          if (!order || !order.id) {
            return this.createOrderAndReload();
          }
          return of(order);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('[CartPage] getCurrentOrder error:', error);
          if (error.status === 404) {
            return this.createOrderAndReload();
          }
          this.resetCartState();
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe((order) => {
        if (!order) {
          return;
        }
        this.order = order;
        this.syncOrderState(order);
      });
  }

  private syncOrderState(order: Order): void {
    console.log('[CartPage] sync order state:', order);
    this.orderId = order.id ? String(order.id) : '';
    this.cartItems = [...order.items];
    this.summary = { ...order.summary };
    this.couponMessage = order.coupon?.isApplied
      ? `Coupon "${order.coupon.code}" applied successfully.`
      : '';
    this.mapSimilarProducts(order.items);
    this.recalculateSummary();
  }

  private createOrderAndReload() {
    console.log('[CartPage] creating order because none exists');
    return this.orderService.createOrder().pipe(
      switchMap((createdOrder) => {
        console.log('[CartPage] createOrder response:', createdOrder);
        return this.orderService.getCurrentOrder();
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[CartPage] createOrder error:', error);
        this.resetCartState();
        return of(null);
      }),
    );
  }

  private resetCartState(): void {
    this.order = null;
    this.orderId = '';
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

  private mapSimilarProducts(items: OrderItem[]): void {
    this.similarProducts = items.map((item) => ({
      id: item.productId,
      name: item.productName,
      image: item.productImage,
      price: item.unitPrice,
    }));
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
