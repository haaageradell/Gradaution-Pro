import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, ViewChild, inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserAddress, UserProfile, UserSettings } from '../../core/models/profile.models';
import { ProfileService } from '../../core/services/profile.service';
import { AddressCardComponent } from './components/address-card.component';
import { AddressModalComponent } from './components/address-modal.component';
import { ProfileFormComponent } from './components/profile-form.component';
import { ProfileOrdersTabComponent } from './components/profile-orders-tab.component';
import { ProfilePaymentMethodsTabComponent } from './components/profile-payment-methods-tab.component';
import { ProfileSectionComponent } from './components/profile-section.component';
import { SidebarMenuComponent } from './components/sidebar-menu.component';
import { WishlistPageComponent } from '../wishlist/pages/wishlist-page.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarMenuComponent,
    ProfileSectionComponent,
    ProfileFormComponent,
    AddressCardComponent,
    AddressModalComponent,
    ProfileOrdersTabComponent,
    ProfilePaymentMethodsTabComponent,
    WishlistPageComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild(ProfileFormComponent) profileFormComponent!: ProfileFormComponent;

  activeTab = 'personal-info';

  // Profile Data States
  profile: UserProfile | null = null;
  profileLoading = false;
  profileError = false;
  profileSaving = false;

  // Addresses States
  addresses: UserAddress[] = [];
  addressesLoading = false;
  addressesError = false;
  addressSaving = false;
  isAddressModalOpen = false;
  selectedAddress: UserAddress | null = null;

  // Delete Address Confirm States
  isDeleteConfirmOpen = false;
  addressToDeleteId: string | null = null;
  deletingAddress = false;

  // Settings State
  settings: UserSettings = {
    darkMode: false,
    notificationsEnabled: true,
    language: 'en',
  };

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfile();
    }
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
    if (tabId === 'addresses' && isPlatformBrowser(this.platformId)) {
      this.loadAddresses();
    }
  }

  // --- Profile Operations ---
  loadProfile(): void {
    this.profileLoading = true;
    this.profileError = false;
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.profileLoading = false;
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.profileLoading = false;
        this.profileError = true;
        this.toastr.error('Failed to load profile details. Please try again.');
      },
    });
  }

  onSaveProfile(updatedProfile: UserProfile): void {
    this.profileSaving = true;
    this.profileService.updateProfile(updatedProfile).subscribe({
      next: (data) => {
        this.profile = data;
        this.profileSaving = false;
        this.toastr.success('Profile updated successfully!');
        if (this.profileFormComponent) {
          this.profileFormComponent.closeEditMode();
        }
      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        this.profileSaving = false;
        const msg = err.message || 'Failed to save profile changes.';
        this.toastr.error(msg);
      },
    });
  }

  // --- Addresses Operations ---
  loadAddresses(): void {
    this.addressesLoading = true;
    this.addressesError = false;
    this.profileService.getAddresses().subscribe({
      next: (data) => {
        this.addresses = data;
        this.addressesLoading = false;
      },
      error: (err) => {
        console.error('Failed to load addresses:', err);
        this.addressesLoading = false;
        this.addressesError = true;
        this.toastr.error(err.message || 'Failed to load addresses.');
      },
    });
  }

  openAddAddressModal(): void {
    this.selectedAddress = null;
    this.isAddressModalOpen = true;
  }

  openEditAddressModal(address: UserAddress): void {
    this.selectedAddress = address;
    this.isAddressModalOpen = true;
  }

  onSaveAddress(address: UserAddress): void {
    if (
      !address.country?.trim() ||
      !address.city?.trim() ||
      !address.street?.trim() ||
      !address.buildingNo?.trim()
    ) {
      this.toastr.warning('Please fill in all required address fields correctly.');
      return;
    }

    const payload: UserAddress = {
      country: address.country.trim(),
      city: address.city.trim(),
      street: address.street.trim(),
      buildingNo: address.buildingNo.trim(),
    };

    this.addressSaving = true;
    if (address.id) {
      this.profileService.updateAddress(address.id, { ...payload }).subscribe({
        next: () => {
          this.addressSaving = false;
          this.isAddressModalOpen = false;
          this.toastr.success('Address updated successfully!');
          this.loadAddresses();
        },
        error: (err) => {
          this.addressSaving = false;
          this.toastr.error(err.message || 'Failed to update address.');
        },
      });
    } else {
      this.profileService.addAddress({ ...payload }).subscribe({
        next: () => {
          this.addressSaving = false;
          this.isAddressModalOpen = false;
          this.toastr.success('Address added successfully!');
          this.loadAddresses();
        },
        error: (err) => {
          this.addressSaving = false;
          this.toastr.error(err.message || 'Failed to add address.');
        },
      });
    }
  }

  openDeleteConfirm(addressId: string): void {
    this.addressToDeleteId = addressId;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen = false;
    this.addressToDeleteId = null;
  }

  onDeleteAddressConfirm(): void {
    if (!this.addressToDeleteId) return;

    this.deletingAddress = true;
    this.profileService.deleteAddress(this.addressToDeleteId).subscribe({
      next: () => {
        this.deletingAddress = false;
        this.isDeleteConfirmOpen = false;
        this.addressToDeleteId = null;
        this.toastr.success('Address deleted successfully!');
        this.loadAddresses();
      },
      error: (err) => {
        this.deletingAddress = false;
        this.toastr.error(err.message || 'Failed to delete address.');
      },
    });
  }

  // --- Settings Operations (Mock) ---
  onSaveSettings(): void {
    this.toastr.success('Settings saved successfully!');
    if (this.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // --- Logout Operations ---
  onLogout(): void {
    localStorage.removeItem('token');
    this.toastr.success('Logged out successfully!');
    this.router.navigateByUrl('/login');
  }
}
