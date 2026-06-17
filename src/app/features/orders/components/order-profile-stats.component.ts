import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { OrderProfileStats } from '../../../core/models/order.model';
import { formatOrderMoney } from '../utils/order-format.util';

@Component({
  selector: 'app-order-profile-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div
        class="rounded-2xl border border-[#ECE8F3] bg-white p-4 shadow-sm"
      >
        <p class="text-[10px] font-semibold uppercase tracking-wide text-[#9D93AF]">
          Total Orders
        </p>
        <p class="mt-1 text-2xl font-extrabold text-[#4B1D5A]">
          {{ stats.totalOrders }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-[#ECE8F3] bg-white p-4 shadow-sm"
      >
        <p class="text-[10px] font-semibold uppercase tracking-wide text-[#9D93AF]">
          Pending Orders
        </p>
        <p class="mt-1 text-2xl font-extrabold text-[#c2410c]">
          {{ stats.pendingOrders }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-[#ECE8F3] bg-white p-4 shadow-sm"
      >
        <p class="text-[10px] font-semibold uppercase tracking-wide text-[#9D93AF]">
          Delivered Orders
        </p>
        <p class="mt-1 text-2xl font-extrabold text-[#15803d]">
          {{ stats.deliveredOrders }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-[#ECE8F3] bg-white p-4 shadow-sm"
      >
        <p class="text-[10px] font-semibold uppercase tracking-wide text-[#9D93AF]">
          Total Spent
        </p>
        <p class="mt-1 text-2xl font-extrabold text-[#2D2340]">
          {{ formatMoney(stats.totalSpent, stats.currency) }}
        </p>
      </div>
    </div>
  `,
})
export class OrderProfileStatsComponent {
  @Input({ required: true }) stats!: OrderProfileStats;

  formatMoney = formatOrderMoney;
}
