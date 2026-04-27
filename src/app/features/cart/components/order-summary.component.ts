import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Coupon, PriceSummary } from '../../../core/models/order.interface';
import { CouponInputComponent } from './coupon-input.component';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule, CouponInputComponent],
  template: `
    <aside class="rounded-2xl border border-[#ECE8F3] bg-white p-6 shadow-sm">
      <h2 class="text-xl font-bold text-[#2D2340]">Order Summary</h2>

      <div class="mt-5 space-y-3 text-sm">
        <div class="flex items-center justify-between text-[#6F6483]">
          <span>Price</span>
          <span class="font-semibold text-[#2D2340]">{{ summary.subtotal | currency: 'EGP ' : 'symbol' : '1.0-0' }}</span>
        </div>
        <div class="flex items-center justify-between text-[#6F6483]">
          <span>Discount</span>
          <span class="font-semibold text-[#2D2340]">-{{ summary.discount | currency: 'EGP ' : 'symbol' : '1.0-0' }}</span>
        </div>
        <div class="flex items-center justify-between text-[#6F6483]">
          <span>Shipping</span>
          <span class="font-semibold text-[#2D2340]">{{ summary.shipping | currency: 'EGP ' : 'symbol' : '1.0-0' }}</span>
        </div>
        <div class="flex items-center justify-between text-[#6F6483]">
          <span>Coupon Applied</span>
          <span class="font-semibold text-[#2D2340]">-{{ summary.couponDiscount | currency: 'EGP ' : 'symbol' : '1.0-0' }}</span>
        </div>
      </div>

      <div class="my-5 h-px bg-[#EFEAF6]"></div>

      <div class="flex items-center justify-between">
        <span class="text-base font-semibold text-[#2D2340]">TOTAL</span>
        <span class="text-2xl font-bold text-[#2D2340]">{{ summary.total | currency: 'EGP ' : 'symbol' : '1.0-0' }}</span>
      </div>

      <p class="mt-2 text-xs text-[#877C99]">
        Estimated Delivery:
        <span class="font-semibold text-[#2D2340]">{{ estimatedDelivery }}</span>
      </p>

      <div class="mt-5">
        <app-coupon-input (couponApplied)="couponApplied.emit($event)"></app-coupon-input>
      </div>

      <p *ngIf="coupon?.isApplied" class="mt-3 text-xs font-semibold text-[#3B9B56]">
        Coupon "{{ coupon?.code }}" applied successfully.
      </p>

      <button
        type="button"
        class="mt-6 h-12 w-full rounded-xl bg-[#4F266E] text-sm font-semibold text-white transition hover:bg-[#5C2D82]"
        (click)="proceed.emit()"
      >
        Proceed to Checkout
      </button>
    </aside>
  `,
})
export class OrderSummaryComponent {
  @Input({ required: true }) summary!: PriceSummary;
  @Input() estimatedDelivery = '';
  @Input() coupon: Coupon | null = null;
  @Output() couponApplied = new EventEmitter<string>();
  @Output() proceed = new EventEmitter<void>();
}
