import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  OrderStatus,
  OrderSummary,
  orderStatusBadgeClass,
} from '../../../core/models/order.model';
import {
  formatOrderDate,
  formatOrderItemLabel,
  formatOrderMoney,
} from '../utils/order-format.util';

@Component({
  selector: 'app-order-preview-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="flex flex-col gap-4 rounded-2xl border border-[#ECE8F3] bg-white p-5 shadow-sm transition hover:border-[#D9CFE8] sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-start gap-4">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F6F4F8] text-[#4B1D5A]"
        >
          <i class="fa-solid fa-receipt text-lg"></i>
        </div>
        <div class="min-w-0 flex flex-col gap-1.5">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-[#9D93AF]">
            Order ID
          </p>
          <p class="truncate text-sm font-bold text-[#2D2340]">
            {{ order.orderNumber || order.id }}
          </p>
          <p class="text-xs text-[#9D93AF]">
            {{ formatDate(order.orderDate) }}
          </p>
        </div>
      </div>

      <div
        class="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-6"
      >
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-semibold uppercase tracking-wide text-[#9D93AF]">
            Total Price
          </span>
          <span class="text-sm font-extrabold text-[#4B1D5A]">
            {{ formatMoney(order.totalAmount, order.currency) }}
          </span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-semibold uppercase tracking-wide text-[#9D93AF]">
            Items
          </span>
          <span class="text-sm font-semibold text-[#2D2340]">
            {{ itemLabel(order.itemCount) }}
          </span>
        </div>

        <div class="col-span-2 flex flex-col gap-2 sm:col-span-1 sm:items-end">
          <span [class]="'order-status ' + statusClass(order.status)">
            {{ order.status }}
          </span>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              (click)="viewDetails.emit(order.id)"
              class="rounded-xl border border-[#ECE8F3] px-4 py-2 text-xs font-bold text-[#5A4F73] transition hover:border-[#D9CFE8] hover:bg-[#F6F4F8] hover:text-[#4B1D5A]"
            >
              View Details
            </button>
            <button
              type="button"
              (click)="trackOrder.emit(order.id)"
              class="rounded-xl bg-[#4F266E] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#5C2D82]"
            >
              Track Order
            </button>
          </div>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      .order-status {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        border-radius: 9999px;
        border-width: 1px;
        padding: 0.2rem 0.65rem;
        font-size: 0.7rem;
        font-weight: 700;
      }
      .order-status--delivered {
        border-color: #bbf7d0;
        background: #f0fdf4;
        color: #15803d;
      }
      .order-status--shipped {
        border-color: #bfdbfe;
        background: #eff6ff;
        color: #1d4ed8;
      }
      .order-status--processing {
        border-color: #fde68a;
        background: #fffbeb;
        color: #b45309;
      }
      .order-status--pending {
        border-color: #fed7aa;
        background: #fff7ed;
        color: #c2410c;
      }
      .order-status--cancelled {
        border-color: #fecaca;
        background: #fef2f2;
        color: #b91c1c;
      }
      .order-status--default {
        border-color: #e5e7eb;
        background: #f9fafb;
        color: #4b5563;
      }
    `,
  ],
})
export class OrderPreviewCardComponent {
  @Input({ required: true }) order!: OrderSummary;
  @Output() viewDetails = new EventEmitter<string>();
  @Output() trackOrder = new EventEmitter<string>();

  formatDate = formatOrderDate;
  formatMoney = formatOrderMoney;
  itemLabel = formatOrderItemLabel;

  statusClass(status: OrderStatus): string {
    return orderStatusBadgeClass(status);
  }
}
