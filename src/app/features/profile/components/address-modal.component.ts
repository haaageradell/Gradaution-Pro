import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserAddress } from '../../../core/models/profile.models';

@Component({
  selector: 'app-address-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-[#2D2340]/60 backdrop-blur-sm transition-opacity"
        (click)="onClose()"
      ></div>

      <!-- Modal Card -->
      <div
        class="relative bg-white rounded-2xl shadow-xl w-full max-w-md border border-[#ECE8F3] overflow-hidden transform transition-all flex flex-col max-h-[90vh]"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-[#F6F4F8] flex items-center justify-between bg-[#F8F6FA]">
          <h3 class="text-base font-bold text-[#2D2340]">
            {{ address ? 'Edit Address' : 'Add New Address' }}
          </h3>
          <button
            type="button"
            (click)="onClose()"
            class="text-[#9D93AF] hover:text-[#4B1D5A] transition w-8 h-8 rounded-full hover:bg-[#ECE8F3] flex items-center justify-center"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Body -->
        <form [formGroup]="addressForm" (ngSubmit)="onSubmit()" class="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <!-- Full Name -->
          <div class="flex flex-col gap-1.5">
            <label for="fullName" class="text-xs font-bold text-[#5A4F73]">Full Name</label>
            <input
              id="fullName"
              type="text"
              formControlName="fullName"
              placeholder="e.g. John Doe"
              class="w-full px-4 py-2.5 rounded-xl border bg-[#F8F6FA] text-sm text-[#2D2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B1D5A]/20 transition"
              [ngClass]="{
                'border-red-400 focus:ring-red-100': hasError('fullName'),
                'border-[#ECE8F3] focus:border-[#4B1D5A]': !hasError('fullName')
              }"
            />
            <span *ngIf="hasError('fullName')" class="text-xs text-red-500 font-medium">
              Full name is required (min 3 characters).
            </span>
          </div>

          <!-- Phone Number -->
          <div class="flex flex-col gap-1.5">
            <label for="modalPhoneNumber" class="text-xs font-bold text-[#5A4F73]">Phone Number</label>
            <input
              id="modalPhoneNumber"
              type="text"
              formControlName="phoneNumber"
              placeholder="e.g. +20 10 12345678"
              class="w-full px-4 py-2.5 rounded-xl border bg-[#F8F6FA] text-sm text-[#2D2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B1D5A]/20 transition"
              [ngClass]="{
                'border-red-400 focus:ring-red-100': hasError('phoneNumber'),
                'border-[#ECE8F3] focus:border-[#4B1D5A]': !hasError('phoneNumber')
              }"
            />
            <span *ngIf="hasError('phoneNumber')" class="text-xs text-red-500 font-medium">
              Phone number is required.
            </span>
          </div>

          <!-- City -->
          <div class="flex flex-col gap-1.5">
            <label for="city" class="text-xs font-bold text-[#5A4F73]">City</label>
            <input
              id="city"
              type="text"
              formControlName="city"
              placeholder="e.g. Cairo"
              class="w-full px-4 py-2.5 rounded-xl border bg-[#F8F6FA] text-sm text-[#2D2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B1D5A]/20 transition"
              [ngClass]="{
                'border-red-400 focus:ring-red-100': hasError('city'),
                'border-[#ECE8F3] focus:border-[#4B1D5A]': !hasError('city')
              }"
            />
            <span *ngIf="hasError('city')" class="text-xs text-red-500 font-medium">
              City is required.
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Street -->
            <div class="flex flex-col gap-1.5">
              <label for="street" class="text-xs font-bold text-[#5A4F73]">Street</label>
              <input
                id="street"
                type="text"
                formControlName="street"
                placeholder="e.g. El-Tahrir St."
                class="w-full px-4 py-2.5 rounded-xl border bg-[#F8F6FA] text-sm text-[#2D2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B1D5A]/20 transition"
                [ngClass]="{
                  'border-red-400 focus:ring-red-100': hasError('street'),
                  'border-[#ECE8F3] focus:border-[#4B1D5A]': !hasError('street')
                }"
              />
              <span *ngIf="hasError('street')" class="text-xs text-red-500 font-medium">
                Street is required.
              </span>
            </div>

            <!-- Building -->
            <div class="flex flex-col gap-1.5">
              <label for="building" class="text-xs font-bold text-[#5A4F73]">Building No.</label>
              <input
                id="building"
                type="text"
                formControlName="building"
                placeholder="e.g. 14B"
                class="w-full px-4 py-2.5 rounded-xl border bg-[#F8F6FA] text-sm text-[#2D2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B1D5A]/20 transition"
                [ngClass]="{
                  'border-red-400 focus:ring-red-100': hasError('building'),
                  'border-[#ECE8F3] focus:border-[#4B1D5A]': !hasError('building')
                }"
              />
              <span *ngIf="hasError('building')" class="text-xs text-red-500 font-medium">
                Building is required.
              </span>
            </div>
          </div>

          <!-- Set as Default -->
          <div class="flex items-center gap-3 mt-2">
            <input
              id="isDefault"
              type="checkbox"
              formControlName="isDefault"
              class="w-4.5 h-4.5 rounded text-[#4B1D5A] border-[#ECE8F3] focus:ring-[#4B1D5A] transition"
            />
            <label for="isDefault" class="text-xs font-semibold text-[#5A4F73] select-none cursor-pointer">
              Set as default shipping address
            </label>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-[#F6F4F8]">
            <button
              type="button"
              (click)="onClose()"
              [disabled]="saving"
              class="px-5 py-2.5 border border-[#ECE8F3] text-[#5A4F73] text-xs font-bold rounded-xl transition hover:bg-[#F6F4F8] disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              type="submit"
              [disabled]="addressForm.invalid || saving"
              class="px-5 py-2.5 bg-[#4B1D5A] text-white text-xs font-bold rounded-xl transition hover:bg-[#3C1748] disabled:opacity-50 flex items-center justify-center min-w-[100px] shadow-sm tracking-wide"
            >
              <i *ngIf="saving" class="fa-solid fa-circle-notch fa-spin mr-2"></i>
              <span>SAVE</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AddressModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() address: UserAddress | null = null;
  @Input() saving = false;
  @Output() save = new EventEmitter<UserAddress>();
  @Output() close = new EventEmitter<void>();

  addressForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.addressForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[+\d\s-]{8,15}$/)]],
      city: ['', [Validators.required]],
      street: ['', [Validators.required]],
      building: ['', [Validators.required]],
      isDefault: [false],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
    }
  }

  resetForm(): void {
    if (this.address) {
      this.addressForm.patchValue({
        fullName: this.address.fullName,
        phoneNumber: this.address.phoneNumber,
        city: this.address.city,
        street: this.address.street,
        building: this.address.building,
        isDefault: this.address.isDefault,
      });
    } else {
      this.addressForm.reset({
        fullName: '',
        phoneNumber: '',
        city: '',
        street: '',
        building: '',
        isDefault: false,
      });
    }
  }

  hasError(controlName: string): boolean {
    const control = this.addressForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.addressForm.valid) {
      const formValue = this.addressForm.value;
      const result: UserAddress = {
        id: this.address?.id, // Preserve ID if editing
        ...formValue,
      };
      this.save.emit(result);
    }
  }
}
