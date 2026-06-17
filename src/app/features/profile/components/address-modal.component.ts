import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateAddressRequest, UserAddress } from '../../../core/models/profile.models';

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
          <!-- Country -->
          <div class="flex flex-col gap-1.5">
            <label for="country" class="text-xs font-bold text-[#5A4F73]">Country</label>
            <input
              id="country"
              type="text"
              formControlName="country"
              placeholder="e.g. Egypt"
              class="w-full px-4 py-2.5 rounded-xl border bg-[#F8F6FA] text-sm text-[#2D2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B1D5A]/20 transition"
              [ngClass]="{
                'border-red-400 focus:ring-red-100': hasError('country'),
                'border-[#ECE8F3] focus:border-[#4B1D5A]': !hasError('country')
              }"
            />
            <span *ngIf="getErrorMessage('country') as msg" class="text-xs text-red-500 font-medium">
              {{ msg }}
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
            <span *ngIf="getErrorMessage('city') as msg" class="text-xs text-red-500 font-medium">
              {{ msg }}
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
              <span *ngIf="getErrorMessage('street') as msg" class="text-xs text-red-500 font-medium">
                {{ msg }}
              </span>
            </div>

            <!-- Building No. -->
            <div class="flex flex-col gap-1.5">
              <label for="buildingNo" class="text-xs font-bold text-[#5A4F73]">Building No.</label>
              <input
                id="buildingNo"
                type="text"
                formControlName="buildingNo"
                placeholder="e.g. 14B"
                class="w-full px-4 py-2.5 rounded-xl border bg-[#F8F6FA] text-sm text-[#2D2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B1D5A]/20 transition"
                [ngClass]="{
                  'border-red-400 focus:ring-red-100': hasError('buildingNo'),
                  'border-[#ECE8F3] focus:border-[#4B1D5A]': !hasError('buildingNo')
                }"
              />
              <span *ngIf="getErrorMessage('buildingNo') as msg" class="text-xs text-red-500 font-medium">
                {{ msg }}
              </span>
            </div>
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
              [disabled]="saving"
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
      country: ['', [Validators.required, Validators.minLength(2)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      street: ['', [Validators.required, Validators.minLength(3)]],
      buildingNo: ['', [Validators.required]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['isOpen'] && this.isOpen) ||
      (changes['address'] && this.isOpen)
    ) {
      this.resetForm();
    }
  }

  resetForm(): void {
    if (this.address) {
      this.addressForm.patchValue({
        country: this.address.country,
        city: this.address.city,
        street: this.address.street,
        buildingNo: this.address.buildingNo,
      });
    } else {
      this.addressForm.reset({
        country: '',
        city: '',
        street: '',
        buildingNo: '',
      });
    }
    this.addressForm.markAsPristine();
    this.addressForm.markAsUntouched();
  }

  hasError(controlName: string): boolean {
    const control = this.addressForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.addressForm.get(controlName);
    if (!control || !this.hasError(controlName) || !control.errors) {
      return null;
    }

    const errors = control.errors;
    const labels: Record<string, string> = {
      country: 'Country',
      city: 'City',
      street: 'Street',
      buildingNo: 'Building number',
    };
    const label = labels[controlName] ?? 'This field';

    if (errors['required']) {
      return `${label} is required.`;
    }
    if (errors['minlength']) {
      return `${label} must be at least ${errors['minlength'].requiredLength} characters.`;
    }
    return 'Please enter a valid value.';
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const formValue = this.addressForm.getRawValue();
    const payload: CreateAddressRequest = {
      country: String(formValue.country ?? '').trim(),
      city: String(formValue.city ?? '').trim(),
      street: String(formValue.street ?? '').trim(),
      buildingNo: String(formValue.buildingNo ?? '').trim(),
    };

    const result: UserAddress = {
      id: this.address?.id,
      ...payload,
    };
    this.save.emit(result);
  }
}
