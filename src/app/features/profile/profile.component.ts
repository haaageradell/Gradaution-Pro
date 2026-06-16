import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, ViewChild, inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserAddress, UserProfile, OrderPlaceholder, WishlistPlaceholder, PaymentMethodPlaceholder, UserSettings } from '../../core/models/profile.models';
import { ProfileService } from '../../core/services/profile.service';
import { AddressCardComponent } from './components/address-card.component';
import { AddressModalComponent } from './components/address-modal.component';
import { ProfileFormComponent } from './components/profile-form.component';
import { ProfileSectionComponent } from './components/profile-section.component';
import { SidebarMenuComponent } from './components/sidebar-menu.component';

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

  // Mock Orders Data
  orders: OrderPlaceholder[] = [
    {
      orderNumber: 'ORD-2026-9874',
      date: '2026-06-10',
      status: 'Delivered',
      totalPrice: 1599.00,
    },
    {
      orderNumber: 'ORD-2026-8854',
      date: '2026-06-13',
      status: 'Shipped',
      totalPrice: 2450.00,
    },
    {
      orderNumber: 'ORD-2026-5542',
      date: '2026-06-15',
      status: 'Processing',
      totalPrice: 899.00,
    },
  ];

  // Mock Wishlist Data
  wishlistItems: WishlistPlaceholder[] = [
    {
      id: 'w1',
      productName: 'Optivio Classic Aviator',
      price: 1899.00,
      productImage: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'w2',
      productName: 'Urban Round Clear Glasses',
      price: 1249.00,
      productImage: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'w3',
      productName: 'Retro Wayfarer Sunglasses',
      price: 1550.00,
      productImage: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=300',
    },
  ];

  // Mock Payment Methods
  paymentMethods: PaymentMethodPlaceholder[] = [
    {
      id: 'pm1',
      brand: 'Visa',
      last4: '1234',
      cardHolderName: 'John Doe',
    },
    {
      id: 'pm2',
      brand: 'Mastercard',
      last4: '5678',
      cardHolderName: 'John Doe',
    },
  ];

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
        this.toastr.error('Failed to load addresses.');
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
    this.addressSaving = true;
    if (address.id) {
      // Edit mode
      this.profileService.updateAddress(address.id, address).subscribe({
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
      // Add mode
      this.profileService.addAddress(address).subscribe({
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

  // --- Wishlist Operations (Mock) ---
  onRemoveWishlistItem(itemId: string): void {
    this.wishlistItems = this.wishlistItems.filter(item => item.id !== itemId);
    this.toastr.success('Product removed from wishlist!');
  }

  // --- Payment Methods Operations (Mock) ---
  onAddPaymentMethodMock(): void {
    this.toastr.info('Add Payment Method dialog is a placeholder in this demo.');
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

  // --- Helper to get status classes ---
  getOrderStatusClass(status: string): string {
    switch (status) {
      case 'Delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Processing':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Pending':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }
}
