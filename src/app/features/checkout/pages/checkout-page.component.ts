import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, forkJoin, of, switchMap } from 'rxjs';
import {
  CartCoupon,
  CartPriceSummary,
  CartViewModel,
} from '../../../core/models/cart.models';
import type { OrderListItem } from '../../../core/models/order-api.models';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { PaymentMethodService } from '../../../core/services/payment-method.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { PaymentMethodView } from '../../../core/models/payment-method.models';
interface CheckoutAddress {
  id: string;
  name: string;
  badge: string;
  lines: string[];
  phone: string;
}

interface CheckoutSimilarProduct {
  id: number;
  name: string;
  image: string;
  price: number;
  oldPrice: number;
  rating: number;
}

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './checkout-page.component.html',
})
export class CheckoutPageComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly productService = inject(ProductService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly isBrowser: boolean;
  private readonly router = inject(Router);
  readonly addresses: CheckoutAddress[] = [
    {
      id: 'addr-home',
      name: 'Huzefa Bagwala',
      badge: 'Home',
      lines: ['301, Lunkad Skymax Mall, Viman Nagar,', 'Pune, Maharashtra'],
      phone: '+91 9976543210',
    },
    {
      id: 'addr-office',
      name: 'Indiatech',
      badge: 'Office',
      lines: ['301, Lunkad Skymax Mall, Viman Nagar,', 'Pune, Maharashtra'],
      phone: '+91 9976543210',
    },
  ];

  selectedAddressId = 'addr-home';
  paymentMethods: PaymentMethodView[] = [];
  selectedPaymentMethodId: string | null = null;
  isLoading = true;
  isSavingCard = false;
  isPlacingOrder = false;
  isApplyingCoupon = false;

  summary: CartPriceSummary = {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    couponDiscount: 0,
    total: 0,
  };
  coupon: CartCoupon | null = null;
  estimatedDeliveryLabel = '01 Feb, 2023';
  couponCodeInput = '';

  /** First order from GET /api/Order — used only for POST .../coupon */
  private orderIdForCoupon: string | null = null;

  similarProducts: CheckoutSimilarProduct[] = [];
  private wishedMap: Record<number, boolean> = {};

  readonly cardForm = this.fb.group({
    holderName: ['', Validators.required],
    cardNumber: ['', Validators.required],
    expireDate: ['', Validators.required],
    cvv: ['', Validators.required],
    saveCard: [true],
  });

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      this.isLoading = false;
      return;
    }
    this.loadPage();
  }

  formatMoney(value: number): string {
    const n = Number.isFinite(value) ? value : 0;
    return `${n.toFixed(2)}EGP`;
  }

  formatMoneyInt(value: number): string {
    const n = Number.isFinite(value) ? Math.round(value) : 0;
    return `${n}EGP`;
  }

  shippingLabel(): string {
    if (!Number.isFinite(this.summary.shipping) || this.summary.shipping <= 0) {
      return 'Free';
    }
    return this.formatMoneyInt(this.summary.shipping);
  }

  maskedCard(pm: PaymentMethodView): string {
    return `.... ${pm.last4}`;
  }

  expiryLabel(pm: PaymentMethodView): string {
    const m = pm.expiryMonth;
    const y = pm.expiryYear;
    if (m != null && y != null) {
      const mm = String(m).padStart(2, '0');
      const yy = y < 100 ? 2000 + y : y;
      return `Expired ${mm}/${yy}`;
    }
    return 'Expired —';
  }

  cardBrandIconClass(pm: PaymentMethodView): string {
    const b = (pm.brand ?? '').toLowerCase();
    if (b.includes('master')) {
      return 'fa-brands fa-cc-mastercard text-[#4B1D5A]';
    }
    if (b.includes('visa')) {
      return 'fa-brands fa-cc-visa text-[#4B1D5A]';
    }
    return 'fa-solid fa-credit-card text-[#4B1D5A]';
  }

  selectPayment(id: string): void {
    this.selectedPaymentMethodId = id;
  }

  deletePaymentMethod(id: string, event: Event): void {
    event.stopPropagation();
    this.paymentMethodService.deletePaymentMethod(id).subscribe({
      next: () => {
        this.paymentMethods = this.paymentMethods.filter((p) => p.id !== id);
        if (this.selectedPaymentMethodId === id) {
          this.selectedPaymentMethodId = this.paymentMethods[0]?.id ?? null;
        }
        this.toastr.success('Payment method removed', 'Checkout');
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.toastr.error('Could not remove payment method', 'Checkout');
      },
    });
  }

  submitNewCard(): void {
    if (this.cardForm.invalid || this.isSavingCard) {
      this.cardForm.markAllAsTouched();
      return;
    }

    const { holderName, cardNumber, expireDate, cvv, saveCard } =
      this.cardForm.getRawValue();
    const parsed = this.parseExpiry(expireDate ?? '');
    if (!parsed) {
      this.toastr.warning('Use MM/YY for expire date', 'Checkout');
      return;
    }
    this.isSavingCard = true;
    const body = {
      cardHolderName: holderName?.trim(),
      cardNumber: (cardNumber ?? '').replace(/\s/g, ''),
      expiryMonth: parsed.month,
      expiryYear: parsed.year,
      cvv: cvv?.trim(),
      saveForFutureCheckout: !!saveCard,
    };
    this.paymentMethodService
      .addPaymentMethod(body)
      .pipe(
        switchMap(() => this.paymentMethodService.getPaymentMethods()),
        finalize(() => {
          this.isSavingCard = false;
        }),
        catchError((err: HttpErrorResponse) => {
          console.error(err);
          this.toastr.error('Could not save card', 'Checkout');
          return EMPTY;
        }),
      )
      .subscribe({
        next: (list: PaymentMethodView[]) => {
          this.paymentMethods = list;
          if (list.length) {
            this.selectedPaymentMethodId = list[list.length - 1]!.id;
          }
          this.toastr.success('Card saved', 'Checkout');
          this.cardForm.reset({ saveCard: true });
        },
      });
  }

  applyCoupon(): void {
    const code = this.couponCodeInput.trim();
    if (!code) {
      this.toastr.warning('Enter a coupon code', 'Checkout');
      return;
    }
    if (!this.orderIdForCoupon) {
      this.toastr.warning(
        'No order is available for coupon yet. Complete cart checkout or try after placing an order.',
        'Checkout',
      );
      return;
    }
    this.isApplyingCoupon = true;
    this.orderService
      .applyCoupon(this.orderIdForCoupon, { couponCode: code })
      .pipe(
        switchMap(() => this.cartService.getCart()),
        finalize(() => {
          this.isApplyingCoupon = false;
        }),
        catchError((err: HttpErrorResponse) => {
          console.error(err);
          this.toastr.error('Coupon could not be applied', 'Checkout');
          return EMPTY;
        }),
      )
      .subscribe({
        next: (cart) => {
          this.summary = { ...cart.summary };
          this.coupon = cart.coupon;
          this.toastr.success('Coupon applied', 'Checkout');
        },
      });
  }

  placeOrder(): void {
    if (this.isPlacingOrder) {
      return;
    }
    this.isPlacingOrder = true;
    const body = {
      shippingAddressId: this.selectedAddressId,
      paymentMethodId: this.selectedPaymentMethodId,
      couponCode: this.couponCodeInput.trim() || null,
    };
    this.orderService
      .createOrder(body)
      .pipe(
        finalize(() => {
          this.isPlacingOrder = false;
        }),
        catchError((err: HttpErrorResponse) => {
          console.error(err);
          this.toastr.error('Could not place order', 'Checkout');
          return EMPTY;
        }),
      )
      .subscribe({
        next: () => {
          this.toastr.success('Order placed successfully', 'Checkout');

          this.cartService.getCart().subscribe({
            next: (cart) => {
              this.cartService.updateCartCountFromItems([]);
            },
          });

          this.router.navigate(['/orders']);
        },
      });
  }

  starFilled(index: number, rating: number): boolean {
    return index <= Math.round(Math.max(0, Math.min(5, rating)));
  }

  toggleWishlist(productId: number, ev: Event): void {
    ev.stopPropagation();
    this.wishedMap = {
      ...this.wishedMap,
      [productId]: !this.wishedMap[productId],
    };
  }

  isWished(productId: number): boolean {
    return !!this.wishedMap[productId];
  }

  addSimilarToCart(product: CheckoutSimilarProduct, ev: Event): void {
    ev.stopPropagation();
    this.cartService
      .addToCart({ productId: product.id, quantity: 1 })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          console.error(err);
          this.toastr.error('Add to cart failed', 'Checkout');
          return EMPTY;
        }),
      )
      .subscribe({
        next: () => {
          this.cartService.getCart().subscribe({
            next: (cart) =>
              this.cartService.updateCartCountFromItems(cart.items),
          });
          this.toastr.success(`${product.name} added to cart`, 'Checkout', {
            positionClass: 'toast-bottom-right',
          });
        },
      });
  }

  private loadPage(): void {
    const emptyCart: CartViewModel = {
      items: [],
      summary: {
        subtotal: 0,
        discount: 0,
        shipping: 0,
        couponDiscount: 0,
        total: 0,
      },
      coupon: null,
    };
    this.isLoading = true;
    forkJoin({
      cart: this.cartService.getCart().pipe(
        catchError((err: HttpErrorResponse) => {
          console.error(err);
          return of(emptyCart);
        }),
      ),
      payments: this.paymentMethodService.getPaymentMethods().pipe(
        catchError((err: HttpErrorResponse) => {
          console.error(err);
          return of([] as PaymentMethodView[]);
        }),
      ),
      orders: this.orderService.getMyOrders().pipe(
        catchError((err: HttpErrorResponse) => {
          console.error(err);
          return of([] as OrderListItem[]);
        }),
      ),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ cart, payments, orders }) => {
          if (cart) {
            this.summary = { ...cart.summary };
            this.coupon = cart.coupon;
            if (cart.estimatedDelivery?.trim()) {
              this.estimatedDeliveryLabel = cart.estimatedDelivery.trim();
            }
          }
          this.paymentMethods = Array.isArray(payments) ? payments : [];
          this.selectedPaymentMethodId = this.paymentMethods[0]?.id ?? null;
          if (Array.isArray(orders) && orders.length) {
            this.orderIdForCoupon = orders[0]!.id || null;
          }
          this.loadSimilarProducts();
        },
      });
  }

  private loadSimilarProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        const products = Array.isArray(response)
          ? response
          : ((response as { data?: Product[] }).data ?? []);
        this.similarProducts = products.slice(0, 4).map((p) => ({
          id: p.id,
          name: p.name,
          image:
            p.thumbnailUrl && p.thumbnailUrl.trim() !== ''
              ? p.thumbnailUrl
              : '',
          price: p.price,
          oldPrice: p.price + 500,
          rating: p.averageRating ?? 5,
        }));
      },
      error: (err) => console.error('[Checkout] similar products', err),
    });
  }

  private parseExpiry(raw: string): { month: number; year: number } | null {
    const t = raw.trim().replace(/\s/g, '');
    const m = /^(\d{2})\/(\d{2,4})$/.exec(t);
    if (!m) {
      return null;
    }
    const month = Number(m[1]);
    let year = Number(m[2]);
    if (month < 1 || month > 12) {
      return null;
    }
    if (m[2]!.length === 2) {
      year += 2000;
    }
    if (year < 2000 || year > 2100) {
      return null;
    }
    return { month, year };
  }
}
