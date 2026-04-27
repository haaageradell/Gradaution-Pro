import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-coupon-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center gap-2">
      <input
        type="text"
        [(ngModel)]="couponCode"
        placeholder="Coupon code"
        class="h-11 flex-1 rounded-xl border border-[#E4DEEE] bg-white px-4 text-sm text-[#2D2340] outline-none placeholder:text-[#A59AAF] focus:border-[#8A68A7]"
      />
      <button
        type="button"
        class="h-11 rounded-xl bg-[#4F266E] px-5 text-sm font-semibold text-white transition hover:bg-[#5C2D82] disabled:cursor-not-allowed disabled:opacity-60"
        (click)="apply()"
        [disabled]="!couponCode.trim()"
      >
        Apply
      </button>
    </div>
  `,
})
export class CouponInputComponent {
  couponCode = '';
  @Output() couponApplied = new EventEmitter<string>();

  apply(): void {
    const normalized = this.couponCode.trim();
    if (!normalized) {
      return;
    }
    this.couponApplied.emit(normalized);
  }
}
