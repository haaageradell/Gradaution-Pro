import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserProfile } from '../../../core/models/profile.models';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Read-Only View Mode -->
      <div *ngIf="!isEditing" class="flex flex-col gap-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div class="bg-[#F8F6FA] px-4 py-3 rounded-xl border border-[#ECE8F3]">
            <span class="block text-xs font-semibold text-[#9D93AF]">First Name</span>
            <span class="text-sm font-semibold text-[#2D2340] mt-0.5 block">
              {{ profile?.firstName || 'Not provided' }}
            </span>
          </div>

          <div class="bg-[#F8F6FA] px-4 py-3 rounded-xl border border-[#ECE8F3]">
            <span class="block text-xs font-semibold text-[#9D93AF]">Last Name</span>
            <span class="text-sm font-semibold text-[#2D2340] mt-0.5 block">
              {{ profile?.lastName || 'Not provided' }}
            </span>
          </div>

          <div class="bg-[#F8F6FA] px-4 py-3 rounded-xl border border-[#ECE8F3]">
            <span class="block text-xs font-semibold text-[#9D93AF]">Email Address</span>
            <span class="text-sm font-semibold text-[#2D2340] mt-0.5 block">
              {{ profile?.email || 'Not provided' }}
            </span>
          </div>

          <div class="bg-[#F8F6FA] px-4 py-3 rounded-xl border border-[#ECE8F3]">
            <span class="block text-xs font-semibold text-[#9D93AF]">Phone Number</span>
            <span class="text-sm font-semibold text-[#2D2340] mt-0.5 block">
              {{ profile?.phoneNumber || 'Not provided' }}
            </span>
          </div>

          <div class="bg-[#F8F6FA] px-4 py-3 rounded-xl border border-[#ECE8F3] md:col-span-2">
            <span class="block text-xs font-semibold text-[#9D93AF]">Date of Birth</span>
            <span class="text-sm font-semibold text-[#2D2340] mt-0.5 block">
              {{ profile?.dateOfBirth ? (profile?.dateOfBirth | date:'dd / MM / yyyy') : 'Not provided' }}
            </span>
          </div>
        </div>

        <div class="flex justify-end mt-2">
          <button
            type="button"
            (click)="toggleEdit()"
            class="px-6 py-3 bg-[#4B1D5A] text-white text-xs font-bold rounded-xl transition hover:bg-[#3C1748] shadow-sm tracking-wide"
          >
            <i class="fa-solid fa-user-pen mr-2"></i> EDIT PROFILE
          </button>
        </div>
      </div>

      <!-- Edit Mode Form -->
      <form *ngIf="isEditing" [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <!-- First Name -->
          <div class="flex flex-col gap-1.5">
            <label for="firstName" class="text-xs font-bold text-[#5A4F73]">First name</label>
            <div class="relative">
              <input
                id="firstName"
                type="text"
                formControlName="firstName"
                placeholder="First name"
                class="w-full px-4 py-3 rounded-xl border bg-[#F8F6FA] text-sm text-[#2D2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B1D5A]/20 transition"
                [ngClass]="{
                  'border-red-400 focus:ring-red-100': hasError('firstName'),
                  'border-[#ECE8F3] focus:border-[#4B1D5A]': !hasError('firstName')
                }"
              />
            </div>
            <span *ngIf="hasError('firstName')" class="text-xs text-red-500 font-medium">
              First name is required (min 2 characters).
            </span>
          </div>

          <!-- Last Name -->
          <div class="flex flex-col gap-1.5">
            <label for="lastName" class="text-xs font-bold text-[#5A4F73]">Last name</label>
            <input
              id="lastName"
              type="text"
              formControlName="lastName"
              placeholder="Last name"
              class="w-full px-4 py-3 rounded-xl border bg-[#F8F6FA] text-sm text-[#2D2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B1D5A]/20 transition"
              [ngClass]="{
                'border-red-400 focus:ring-red-100': hasError('lastName'),
                'border-[#ECE8F3] focus:border-[#4B1D5A]': !hasError('lastName')
              }"
            />
            <span *ngIf="hasError('lastName')" class="text-xs text-red-500 font-medium">
              Last name is required (min 2 characters).
            </span>
          </div>

          <!-- Email -->
          <div class="flex flex-col gap-1.5">
            <label for="email" class="text-xs font-bold text-[#5A4F73]">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="optivioglasses@gmail.com"
              class="w-full px-4 py-3 rounded-xl border bg-[#F8F6FA] text-sm text-[#2D2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B1D5A]/20 transition"
              [ngClass]="{
                'border-red-400 focus:ring-red-100': hasError('email'),
                'border-[#ECE8F3] focus:border-[#4B1D5A]': !hasError('email')
              }"
            />
            <span *ngIf="hasError('email')" class="text-xs text-red-500 font-medium">
              Please enter a valid email address.
            </span>
          </div>

          <!-- Phone Number -->
          <div class="flex flex-col gap-1.5">
            <label for="phoneNumber" class="text-xs font-bold text-[#5A4F73]">Phone number</label>
            <input
              id="phoneNumber"
              type="text"
              formControlName="phoneNumber"
              placeholder="+20 10 12345678"
              class="w-full px-4 py-3 rounded-xl border bg-[#F8F6FA] text-sm text-[#2D2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B1D5A]/20 transition"
              [ngClass]="{
                'border-red-400 focus:ring-red-100': hasError('phoneNumber'),
                'border-[#ECE8F3] focus:border-[#4B1D5A]': !hasError('phoneNumber')
              }"
            />
            <span *ngIf="hasError('phoneNumber')" class="text-xs text-red-500 font-medium">
              Please enter a valid phone number.
            </span>
          </div>

          <!-- Date of Birth -->
          <div class="flex flex-col gap-1.5 md:col-span-2">
            <label for="dateOfBirth" class="text-xs font-bold text-[#5A4F73]">Date of birth</label>
            <input
              id="dateOfBirth"
              type="date"
              formControlName="dateOfBirth"
              class="w-full px-4 py-3 rounded-xl border bg-[#F8F6FA] text-sm text-[#2D2340] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4B1D5A]/20 transition"
              [ngClass]="{
                'border-[#ECE8F3] focus:border-[#4B1D5A]': true
              }"
            />
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-2">
          <button
            type="button"
            (click)="cancelEdit()"
            [disabled]="saving"
            class="px-6 py-3 border border-[#ECE8F3] text-[#5A4F73] text-xs font-bold rounded-xl transition hover:bg-[#F6F4F8] disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="submit"
            [disabled]="profileForm.invalid || saving"
            class="px-6 py-3 bg-[#4B1D5A] text-white text-xs font-bold rounded-xl transition hover:bg-[#3C1748] disabled:opacity-50 flex items-center justify-center min-w-[120px] shadow-sm tracking-wide"
          >
            <i *ngIf="saving" class="fa-solid fa-circle-notch fa-spin mr-2"></i>
            <span>SAVE CHANGES</span>
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ProfileFormComponent implements OnChanges {
  @Input() profile: UserProfile | null = null;
  @Input() saving = false;
  @Output() save = new EventEmitter<UserProfile>();

  isEditing = false;
  profileForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[+\d\s-]{8,15}$/)]],
      dateOfBirth: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profile'] && this.profile) {
      this.resetForm();
    }
  }

  toggleEdit(): void {
    this.isEditing = true;
    this.resetForm();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.resetForm();
  }

  resetForm(): void {
    if (this.profile) {
      this.profileForm.patchValue({
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        email: this.profile.email,
        phoneNumber: this.profile.phoneNumber,
        dateOfBirth: this.profile.dateOfBirth || '',
      });
    }
  }

  hasError(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.value;
      const updatedProfile: UserProfile = {
        ...this.profile,
        ...formValue,
        // Ensure date of birth is empty string instead of null if cleared
        dateOfBirth: formValue.dateOfBirth || undefined,
      };
      this.save.emit(updatedProfile);
    }
  }

  // Allow parent to close edit mode on successful save
  closeEditMode(): void {
    this.isEditing = false;
  }
}
