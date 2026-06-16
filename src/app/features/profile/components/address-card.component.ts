import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserAddress } from '../../../core/models/profile.models';

@Component({
  selector: 'app-address-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="relative flex flex-col justify-between p-5 rounded-2xl border transition shadow-sm h-full bg-white"
      [ngClass]="{
        'border-[#4B1D5A] ring-1 ring-[#4B1D5A]/20': address.isDefault,
        'border-[#ECE8F3] hover:border-[#D9CFE8]': !address.isDefault
      }"
    >
      <!-- Default Badge -->
      <div *ngIf="address.isDefault" class="absolute top-4 right-4 flex items-center gap-1.5 bg-[#4B1D5A]/10 text-[#4B1D5A] px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide">
        <i class="fa-solid fa-circle-check"></i>
        <span>DEFAULT</span>
      </div>

      <div class="flex flex-col gap-3 flex-1 pr-16">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-user text-xs text-[#9D93AF]"></i>
          <h4 class="text-sm font-bold text-[#2D2340] leading-none">{{ address.fullName }}</h4>
        </div>

        <div class="flex items-center gap-2">
          <i class="fa-solid fa-phone text-xs text-[#9D93AF]"></i>
          <span class="text-xs font-semibold text-[#5A4F73]">{{ address.phoneNumber }}</span>
        </div>

        <div class="flex items-start gap-2 mt-1">
          <i class="fa-solid fa-location-dot text-xs text-[#9D93AF] mt-0.5"></i>
          <div class="text-xs font-semibold text-[#5A4F73] leading-relaxed">
            <span class="block">Bldg. {{ address.building }}, {{ address.street }}</span>
            <span class="block text-[#9D93AF]">{{ address.city }}</span>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-between border-t border-[#F6F4F8] mt-4 pt-3">
        <span class="text-[10px] text-[#9D93AF] font-medium">Shipping Address</span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="onEditClick()"
            class="w-8 h-8 rounded-lg border border-[#ECE8F3] text-[#5A4F73] hover:bg-[#F6F4F8] hover:text-[#4B1D5A] flex items-center justify-center transition"
            title="Edit Address"
          >
            <i class="fa-solid fa-pencil text-[11px]"></i>
          </button>
          <button
            type="button"
            (click)="onDeleteClick()"
            class="w-8 h-8 rounded-lg border border-[#ECE8F3] text-[#9D93AF] hover:bg-red-50 hover:text-red-500 hover:border-red-100 flex items-center justify-center transition"
            title="Delete Address"
          >
            <i class="fa-solid fa-trash-can text-[11px]"></i>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AddressCardComponent {
  @Input({ required: true }) address!: UserAddress;
  @Output() edit = new EventEmitter<UserAddress>();
  @Output() delete = new EventEmitter<string>();

  onEditClick(): void {
    this.edit.emit(this.address);
  }

  onDeleteClick(): void {
    if (this.address.id) {
      this.delete.emit(this.address.id);
    }
  }
}
