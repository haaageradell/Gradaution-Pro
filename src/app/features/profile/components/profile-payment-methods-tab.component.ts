import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EMPTY, Subject, catchError, finalize, map, switchMap, takeUntil } from 'rxjs';
import type { PaymentMethodView } from '../../../core/models/payment-method.models';
import { PaymentMethodService } from '../../../core/services/payment-method.service';
import { buildCreatePaymentMethodRequest } from '../../../core/utils/payment-card.utils';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile-payment-methods-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-payment-methods-tab.component.html',
})
export class ProfilePaymentMethodsTabComponent implements OnInit, OnDestroy {
  private readonly paymentMethodService = inject(PaymentMethodService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  private readonly isBrowser: boolean;

  paymentMethods = signal<PaymentMethodView[]>([]);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  isSavingCard = signal(false);
  deletingPaymentId = signal<string | null>(null);
  isAddModalOpen = signal(false);

  readonly cardForm = this.fb.group({
    holderName: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: ['', [Validators.required]],
    expireDate: ['', [Validators.required]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    saveCard: [true],
  });

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      this.isLoading.set(false);
      return;
    }
    this.loadPaymentMethods();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openAddModal(): void {
    this.cardForm.reset({ saveCard: true });
    this.cardForm.markAsPristine();
    this.cardForm.markAsUntouched();
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void {
    if (this.isSavingCard()) {
      return;
    }
    this.isAddModalOpen.set(false);
  }

  retryLoad(): void {
    this.loadError.set(null);
    this.loadPaymentMethods();
  }

  maskedCard(pm: PaymentMethodView): string {
    return `••••  ••••  ••••  ${pm.last4}`;
  }

  expiryLabel(pm: PaymentMethodView): string {
    const month = pm.expiryMonth;
    const year = pm.expiryYear;
    if (month != null && year != null) {
      const mm = String(month).padStart(2, '0');
      const yy = year < 100 ? String(2000 + year).slice(-2) : String(year).slice(-2);
      return `Expires ${mm}/${yy}`;
    }
    return 'Expiry date unavailable';
  }

  cardBrandIconClass(pm: PaymentMethodView): string {
    const brand = (pm.brand ?? '').toLowerCase();
    if (brand.includes('master')) {
      return 'fa-brands fa-cc-mastercard text-red-500';
    }
    if (brand.includes('visa')) {
      return 'fa-brands fa-cc-visa text-blue-600';
    }
    return 'fa-solid fa-credit-card text-[#4B1D5A]';
  }

  hasError(controlName: string): boolean {
    const control = this.cardForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.cardForm.get(controlName);
    if (!control || !this.hasError(controlName) || !control.errors) {
      return null;
    }

    const errors = control.errors;
    if (errors['required']) {
      return 'This field is required.';
    }
    if (errors['minlength']) {
      return `Must be at least ${errors['minlength'].requiredLength} characters.`;
    }
    if (errors['pattern']) {
      switch (controlName) {
        case 'cvv':
          return 'Enter a valid 3 or 4 digit CVV.';
        default:
          return 'Please enter a valid value.';
      }
    }
    return 'Please enter a valid value.';
  }

  submitNewCard(): void {
    if (this.isSavingCard()) {
      return;
    }

    if (this.cardForm.invalid) {
      this.cardForm.markAllAsTouched();
      this.toastr.warning('Please fill in all required card fields correctly.');
      return;
    }

    const formValues = this.cardForm.getRawValue();
    const cardNumber = (formValues.cardNumber ?? '').replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19 || !/^\d+$/.test(cardNumber)) {
      this.toastr.warning('Enter a valid card number (13–19 digits).');
      return;
    }

    const requestBody = buildCreatePaymentMethodRequest({
      cardNumber,
      expireDate: formValues.expireDate ?? '',
      isDefault: !!formValues.saveCard,
    });

    if (!requestBody) {
      this.toastr.warning('Use MM/YY for the expiry date.');
      return;
    }

    this.isSavingCard.set(true);
    this.paymentMethodService
      .addPaymentMethod(requestBody)
      .pipe(
        switchMap(() => this.paymentMethodService.getPaymentMethods()),
        map((list) => list.filter((pm) => pm.id.trim() !== '')),
        catchError((err: HttpErrorResponse) => {
          console.error('[ProfilePaymentMethodsTab] addPaymentMethod error:', err);
          const message = this.extractErrorMessage(err, 'Could not save payment method.');
          this.toastr.error(message);
          return EMPTY;
        }),
        finalize(() => this.isSavingCard.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (list) => {
          this.paymentMethods.set(list);
          this.cardForm.reset({ saveCard: true });
          this.isAddModalOpen.set(false);
          this.toastr.success('Payment method added successfully!');
        },
      });
  }

  deletePaymentMethod(id: string): void {
    if (!id || this.deletingPaymentId() === id) {
      return;
    }

    this.deletingPaymentId.set(id);
    this.paymentMethodService
      .deletePaymentMethod(id)
      .pipe(
        switchMap(() => this.paymentMethodService.getPaymentMethods()),
        map((list) => list.filter((pm) => pm.id.trim() !== '')),
        catchError((err: HttpErrorResponse) => {
          console.error('[ProfilePaymentMethodsTab] deletePaymentMethod error:', err);
          const message = this.extractErrorMessage(err, 'Could not remove payment method.');
          this.toastr.error(message);
          return EMPTY;
        }),
        finalize(() => this.deletingPaymentId.set(null)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (list) => {
          this.paymentMethods.set(list);
          this.toastr.success('Payment method removed successfully!');
        },
      });
  }

  private loadPaymentMethods(): void {
    if (!this.isAuthenticated()) {
      this.isLoading.set(false);
      this.loadError.set('Please sign in to manage payment methods.');
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    this.paymentMethodService
      .getPaymentMethods()
      .pipe(
        map((list) => list.filter((pm) => pm.id.trim() !== '')),
        catchError((err: HttpErrorResponse) => {
          console.error('[ProfilePaymentMethodsTab] loadPaymentMethods error:', err);
          const message = this.extractErrorMessage(err, 'Failed to load payment methods.');
          this.loadError.set(message);
          this.toastr.error(message);
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (list) => this.paymentMethods.set(list),
      });
  }

  private isAuthenticated(): boolean {
    return this.isBrowser && Boolean(localStorage.getItem('token')?.trim());
  }

  private extractErrorMessage(err: HttpErrorResponse, fallback: string): string {
    const backendMessage =
      (err.error as { message?: string; title?: string })?.message ??
      (err.error as { message?: string; title?: string })?.title;
    return backendMessage ?? (typeof err.error === 'string' ? err.error : fallback);
  }
}
