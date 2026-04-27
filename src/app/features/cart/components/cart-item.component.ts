import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OrderItem } from '../../../core/models/order.interface';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="flex flex-col gap-4 rounded-2xl border border-[#ECE8F3] bg-white p-4 shadow-sm sm:flex-row sm:items-center"
    >
      <img
        [src]="item.productImage"
        [alt]="item.productName"
        class="h-24 w-full rounded-xl object-cover sm:w-24"
      />

      <div class="flex-1">
        <h3 class="text-base font-semibold text-[#2D2340]">{{ item.productName }}</h3>
        <div class="mt-3 inline-flex items-center gap-2 rounded-full border border-[#E4DEEE] p-1">
          <button
            type="button"
            class="h-8 w-8 rounded-full bg-[#F8F5FC] text-[#4F266E] transition hover:bg-[#EEE6F8]"
            (click)="quantityChanged.emit(-1)"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span class="min-w-8 text-center text-sm font-semibold text-[#322747]">{{ item.quantity }}</span>
          <button
            type="button"
            class="h-8 w-8 rounded-full bg-[#4F266E] text-white transition hover:bg-[#5C2D82]"
            (click)="quantityChanged.emit(1)"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <button
          type="button"
          class="text-lg text-[#9D93AF] transition hover:text-[#D04E4E]"
          (click)="removed.emit()"
          aria-label="Remove item"
        >
          <i class="fa-regular fa-trash-can"></i>
        </button>
        <p class="text-lg font-bold text-[#2D2340]">
          {{ item.unitPrice * item.quantity | currency: 'EGP ' : 'symbol' : '1.0-0' }}
        </p>
      </div>
    </article>
  `,
})
export class CartItemComponent {
  @Input({ required: true }) item!: OrderItem;
  @Output() quantityChanged = new EventEmitter<number>();
  @Output() removed = new EventEmitter<void>();
}
