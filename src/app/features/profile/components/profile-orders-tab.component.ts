import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, finalize, switchMap, takeUntil } from 'rxjs';
import { OrderSummary } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';
import { OrderDetailModalComponent } from '../../orders/components/order-detail-modal.component';
import { OrderPreviewCardComponent } from '../../orders/components/order-preview-card.component';
import { OrderProfileStatsComponent } from '../../orders/components/order-profile-stats.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile-orders-tab',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    OrderProfileStatsComponent,
    OrderPreviewCardComponent,
    OrderDetailModalComponent,
  ],
  templateUrl: './profile-orders-tab.component.html',
})
export class ProfileOrdersTabComponent implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly isBrowser: boolean;

  isLoading = signal(true);
  loadError = signal<string | null>(null);
  orders = signal<OrderSummary[]>([]);
  selectedOrderId = signal<string | null>(null);
  orderToCancelId = signal<string | null>(null);
  isCancelConfirmOpen = signal(false);
  cancellingOrderId = signal<string | null>(null);

  profileStats = computed(() =>
    this.orderService.computeProfileStats(this.orders()),
  );

  skeletonItems = Array.from({ length: 3 });

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      this.isLoading.set(false);
      return;
    }

    const cached = this.orderService.ordersSnapshot;
    if (cached.length) {
      this.orders.set(cached);
      this.isLoading.set(false);
    }

    this.orderService.orders$
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.orders.set(items);
      });

    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openDetails(orderId: string): void {
    this.selectedOrderId.set(orderId);
  }

  trackOrder(orderId: string): void {
    this.router.navigate(['/orders'], {
      queryParams: { orderId },
    });
  }

  closeDetails(): void {
    this.selectedOrderId.set(null);
  }

  openCancelConfirm(orderId: string): void {
    this.orderToCancelId.set(orderId);
    this.isCancelConfirmOpen.set(true);
  }

  closeCancelConfirm(): void {
    if (this.cancellingOrderId()) {
      return;
    }
    this.isCancelConfirmOpen.set(false);
    this.orderToCancelId.set(null);
  }

  confirmCancelOrder(): void {
    const orderId = this.orderToCancelId();
    if (!orderId || this.cancellingOrderId() === orderId) {
      return;
    }

    this.cancellingOrderId.set(orderId);
    this.orderService
      .cancelOrder(orderId)
      .pipe(
        switchMap(() => this.orderService.refreshOrders()),
        catchError((err: HttpErrorResponse) => {
          console.error('[ProfileOrdersTab] cancelOrder error:', err);
          const message = this.orderService.getErrorMessage(
            err,
            'Could not cancel order. Please try again.',
          );
          this.toastr.error(message, 'My Orders', {
            positionClass: 'toast-bottom-right',
          });
          return EMPTY;
        }),
        finalize(() => this.cancellingOrderId.set(null)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.isCancelConfirmOpen.set(false);
          this.orderToCancelId.set(null);
          this.toastr.success('Order cancelled successfully', 'My Orders', {
            positionClass: 'toast-bottom-right',
          });
        },
      });
  }

  retryLoad(): void {
    this.loadError.set(null);
    this.loadOrders(true);
  }

  private loadOrders(forceRefresh = false): void {
    if (!this.isAuthenticated()) {
      this.isLoading.set(false);
      this.loadError.set('Please sign in to view your orders.');
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    this.orderService
      .ensureOrdersLoaded(forceRefresh)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('[ProfileOrdersTab] loadOrders error:', err);
          const message = this.orderService.getErrorMessage(err);
          this.loadError.set(message);
          this.toastr.error(message, 'My Orders', {
            positionClass: 'toast-bottom-right',
          });
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  private isAuthenticated(): boolean {
    return (
      this.isBrowser && Boolean(localStorage.getItem('token')?.trim())
    );
  }
}
