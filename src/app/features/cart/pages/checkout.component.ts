import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service';
import { PaymentMethodService } from '../../../core/services/payment-method.service';
import type {
  PaymentMethod,
  ShippingAddress,
  CreatePaymentMethodRequest,
} from '../../../core/models/payment-method.models';
import { ToastrService } from 'ngx-toastr';

interface OrderSummary {
  price: number;
  discount: number;
  shipping: number;
  couponApplied: number;
  total: number;
  estimatedDelivery: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly toastr = inject(ToastrService);

  paymentMethods: PaymentMethod[] = [];
  selectedPaymentMethodId: string | null = null;
  selectedAddressId: string | null = null;
  saveCardForFuture = false;

  paymentForm!: FormGroup;
  couponCode = '';
  isLoadingPaymentMethods = false;
  isPlacingOrder = false;

  // Mock data for addresses
  addresses: ShippingAddress[] = [
    {
      id: '1',
      name: 'Huzefa Bagwala',
      addressLine: '103 Deity Fawners, Jacksonville, TX 40232',
      contact: '(306) 361-0310',
      type: 'Home',
      isDefault: true,
    },
    {
      id: '2',
      name: 'Indiatech',
      addressLine: '1919 Deity Fawners, Jacksonville, TX 40232',
      contact: '(306) 361-0310',
      type: 'Office',
      isDefault: false,
    },
  ];

  // Mock order summary
  orderSummary: OrderSummary = {
    price: 15000.0,
    discount: 5000.0,
    shipping: 0,
    couponApplied: 0.0,
    total: 10000.0,
    estimatedDelivery: '01 Feb, 2023',
  };

  // Mock similar products
  similarProducts = [
    { id: 1, name: 'Product 1', price: 100, oldPrice: 150, rating: 4.5 },
    { id: 2, name: 'Product 2', price: 120, oldPrice: 180, rating: 4.8 },
    { id: 3, name: 'Product 3', price: 110, oldPrice: 160, rating: 4.2 },
    { id: 4, name: 'Product 4', price: 130, oldPrice: 190, rating: 4.6 },
  ];

  ngOnInit(): void {
    this.initializePaymentForm();
    this.loadPaymentMethods();
    this.selectDefaultAddress();
  }

  private initializePaymentForm(): void {
    this.paymentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
    });
  }

  private loadPaymentMethods(): void {
    this.isLoadingPaymentMethods = true;
    this.paymentMethodService
      .getPaymentMethods()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (methods) => {
          this.paymentMethods = methods;
          if (methods.length > 0) {
            this.selectedPaymentMethodId = methods[0].id;
          }
          this.isLoadingPaymentMethods = false;
        },
        error: (err) => {
          console.error('Failed to load payment methods:', err);
          this.isLoadingPaymentMethods = false;
        },
      });
  }

  private selectDefaultAddress(): void {
    const defaultAddress = this.addresses.find((a) => a.isDefault);
    if (defaultAddress) {
      this.selectedAddressId = defaultAddress.id;
    }
  }

  selectAddress(addressId: string): void {
    this.selectedAddressId = addressId;
  }

  selectPaymentMethod(paymentMethodId: string): void {
    this.selectedPaymentMethodId = paymentMethodId;
  }

  deletePaymentMethod(paymentMethodId: string, event: Event): void {
    event.preventDefault();
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    this.paymentMethodService
      .deletePaymentMethod(paymentMethodId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.paymentMethods = this.paymentMethods.filter((m) => m.id !== paymentMethodId);
          if (this.selectedPaymentMethodId === paymentMethodId) {
            this.selectedPaymentMethodId = this.paymentMethods[0]?.id || null;
          }
          this.toastr.success('Payment method deleted successfully');
        },
        error: (err) => {
          console.error('Failed to delete payment method:', err);
          this.toastr.error('Failed to delete payment method');
        },
      });
  }

  addNewPaymentMethod(): void {
    if (!this.paymentForm.valid) {
      this.toastr.error('Please fill in all payment details correctly');
      return;
    }

    const formValue = this.paymentForm.value;
    const request: CreatePaymentMethodRequest = {
      cardNumber: formValue.cardNumber,
      cardHolder: formValue.name,
      expiryDate: formValue.expiryDate,
      cvv: formValue.cvv,
    };

    this.paymentMethodService
      .createPaymentMethod(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newMethod) => {
          this.paymentMethods.push(newMethod);
          this.selectedPaymentMethodId = newMethod.id;
          this.paymentForm.reset();
          this.saveCardForFuture = false;
          this.toastr.success('Payment method added successfully');
        },
        error: (err) => {
          console.error('Failed to add payment method:', err);
          this.toastr.error('Failed to add payment method');
        },
      });
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      this.toastr.error('Please enter a coupon code');
      return;
    }

    // Note: You would call applyCoupon from orderService here
    // This is a mock implementation for now
    this.orderSummary.couponApplied = 500; // Mock discount
    this.orderSummary.total = this.orderSummary.price - this.orderSummary.discount - this.orderSummary.couponApplied;
    this.toastr.success('Coupon applied successfully');
  }

  placeOrder(): void {
    if (!this.selectedAddressId) {
      this.toastr.error('Please select a shipping address');
      return;
    }

    if (!this.selectedPaymentMethodId) {
      this.toastr.error('Please select a payment method');
      return;
    }

    this.isPlacingOrder = true;

    this.orderService
      .createOrder({
        shippingAddressId: this.selectedAddressId,
        paymentMethodId: this.selectedPaymentMethodId,
        couponCode: this.couponCode || null,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.isPlacingOrder = false;
          this.toastr.success('Order placed successfully!');
          console.log('Order created:', order);
        },
        error: (err) => {
          this.isPlacingOrder = false;
          console.error('Failed to place order:', err);
          this.toastr.error('Failed to place order');
        },
      });
  }

  addNewAddress(): void {
    this.toastr.info('Add new address functionality would be implemented here');
  }

  getMaskedCardNumber(cardNumber: string): string {
    if (!cardNumber) return '';
    const last4 = cardNumber.slice(-4);
    return `•••• ${last4}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
