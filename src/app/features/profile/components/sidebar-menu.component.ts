import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
  subLabel?: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full bg-white rounded-2xl border border-[#ECE8F3] p-4 shadow-sm md:p-6">
      <div class="hidden md:block mb-6">
        <h2 class="text-xl font-bold text-[#2D2340]">My Account</h2>
        <p class="text-xs text-[#9D93AF] mt-1">Manage your settings and preferences</p>
      </div>

      <!-- Desktop Sidebar Navigation -->
      <nav class="hidden md:flex flex-col gap-2 flex-1">
        <button
          *ngFor="let item of menuItems"
          type="button"
          (click)="onTabClick(item.id)"
          class="flex items-center gap-4 w-full p-3 rounded-xl transition text-left group"
          [ngClass]="{
            'bg-[#4B1D5A] text-white': activeTab === item.id,
            'text-[#5A4F73] hover:bg-[#F6F4F8] hover:text-[#4B1D5A]': activeTab !== item.id
          }"
        >
          <div
            class="flex items-center justify-center w-10 h-10 rounded-lg transition"
            [ngClass]="{
              'bg-[#3D174A] text-white': activeTab === item.id,
              'bg-[#F6F4F8] text-[#5A4F73] group-hover:bg-[#ECE8F3] group-hover:text-[#4B1D5A]': activeTab !== item.id
            }"
          >
            <i [class]="item.icon + ' text-base'"></i>
          </div>
          <div class="flex-1">
            <div class="text-sm font-semibold">{{ item.label }}</div>
            <div
              *ngIf="item.subLabel"
              class="text-[10px] mt-0.5"
              [ngClass]="{
                'text-purple-200': activeTab === item.id,
                'text-[#9D93AF]': activeTab !== item.id
              }"
            >
              {{ item.subLabel }}
            </div>
          </div>
          <i
            class="fa-solid fa-chevron-right text-xs transition"
            [ngClass]="{
              'text-purple-200 translate-x-0.5': activeTab === item.id,
              'text-[#9D93AF] group-hover:text-[#4B1D5A] group-hover:translate-x-0.5': activeTab !== item.id
            }"
          ></i>
        </button>
      </nav>

      <!-- Mobile Scrollable Tabs -->
      <div class="md:hidden overflow-x-auto scrollbar-none flex gap-2 pb-2">
        <button
          *ngFor="let item of menuItems"
          type="button"
          (click)="onTabClick(item.id)"
          class="flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold transition"
          [ngClass]="{
            'bg-[#4B1D5A] text-white shadow-sm': activeTab === item.id,
            'bg-[#F6F4F8] text-[#5A4F73] hover:bg-[#ECE8F3]': activeTab !== item.id
          }"
        >
          <i [class]="item.icon"></i>
          <span>{{ item.label }}</span>
        </button>
      </div>

      <!-- Logout Button (Desktop) -->
      <div class="hidden md:block mt-6 pt-4 border-t border-[#ECE8F3]">
        <button
          type="button"
          (click)="onLogoutClick()"
          class="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-[#D04E4E] text-[#D04E4E] hover:bg-[#FDF4F4] transition font-semibold text-sm"
        >
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>LOGOUT</span>
        </button>
      </div>

      <!-- Logout Button (Mobile) -->
      <div class="md:hidden mt-2 pt-2 border-t border-[#ECE8F3] flex justify-end">
        <button
          type="button"
          (click)="onLogoutClick()"
          class="flex items-center gap-2 px-4 py-2 rounded-full border border-[#D04E4E] text-[#D04E4E] hover:bg-[#FDF4F4] transition font-semibold text-xs"
        >
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      /* Hide scrollbar for Chrome, Safari and Opera */
      .scrollbar-none::-webkit-scrollbar {
        display: none;
      }
      /* Hide scrollbar for IE, Edge and Firefox */
      .scrollbar-none {
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
      }
    `,
  ],
})
export class SidebarMenuComponent {
  @Input({ required: true }) activeTab!: string;
  @Output() tabChange = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  readonly menuItems: TabItem[] = [
    {
      id: 'personal-info',
      label: 'Profile Information',
      subLabel: 'Personal details & contact',
      icon: 'fa-regular fa-user',
    },
    {
      id: 'addresses',
      label: 'Addresses',
      subLabel: 'Shipping & billing addresses',
      icon: 'fa-solid fa-location-dot',
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      subLabel: 'Your saved favorite frames',
      icon: 'fa-regular fa-heart',
    },
    {
      id: 'orders',
      label: 'My Orders',
      subLabel: 'Track & view order history',
      icon: 'fa-solid fa-box',
    },
    {
      id: 'payment-methods',
      label: 'Payment Methods',
      subLabel: 'Manage cards & wallets',
      icon: 'fa-solid fa-credit-card',
    },
    {
      id: 'settings',
      label: 'Settings',
      subLabel: 'Theme, notification & language',
      icon: 'fa-solid fa-gear',
    },
  ];

  onTabClick(id: string): void {
    this.tabChange.emit(id);
  }

  onLogoutClick(): void {
    this.logout.emit();
  }
}
