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
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  finalize,
  takeUntil,
} from 'rxjs';
import {
  ORDER_STATUSES,
  OrderStatus,
  OrderSummary,
  orderStatusBadgeClass,
} from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { OrderDetailModalComponent } from '../components/order-detail-modal.component';
import { ToastrService } from 'ngx-toastr';
import {
  formatOrderDate,
  formatOrderItemLabel,
  formatOrderMoney,
} from '../utils/order-format.util';

type StatusFilter = OrderStatus | 'All';
type SortOrder = 'desc' | 'asc';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PaginationComponent,
    OrderDetailModalComponent,
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  private readonly isBrowser: boolean;

  readonly statusOptions: StatusFilter[] = ['All', ...ORDER_STATUSES];
  readonly fallbackImage = 'https://picsum.photos/300/300';
  readonly pageSize = 6;

  isLoading = signal(true);
  loadError = signal<string | null>(null);
  allOrders = signal<OrderSummary[]>([]);
  searchQuery = signal('');
  statusFilter = signal<StatusFilter>('All');
  sortOrder = signal<SortOrder>('desc');
  currentPage = signal(1);
  selectedOrderId = signal<string | null>(null);

  statusCounts = computed(() =>
    this.orderService.computeStatusCounts(this.allOrders()),
  );

  filteredOrders = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return this.allOrders().filter((order) => {
      const matchesStatus =
        status === 'All' ||
        order.status.toLowerCase() === status.toLowerCase();
      const matchesSearch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.orderNumber.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  });

  sortedOrders = computed(() => {
    const orders = [...this.filteredOrders()];
    const direction = this.sortOrder() === 'desc' ? -1 : 1;
    return orders.sort((a, b) => {
      const ta = a.orderDate ? Date.parse(a.orderDate) : 0;
      const tb = b.orderDate ? Date.parse(b.orderDate) : 0;
      return (
        (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0)
      ) * -direction;
    });
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedOrders().length / this.pageSize)),
  );

  paginatedOrders = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return this.sortedOrders().slice(start, start + this.pageSize);
  });

  skeletonItems = Array.from({ length: 4 });

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      this.isLoading.set(false);
      return;
    }

    if (!this.isAuthenticated()) {
      this.isLoading.set(false);
      this.loadError.set('Please sign in to view your orders.');
      return;
    }

    const cached = this.orderService.ordersSnapshot;
    if (cached.length) {
      this.allOrders.set(cached);
      this.isLoading.set(false);
    }

    this.orderService.orders$
      .pipe(takeUntil(this.destroy$))
      .subscribe((orders) => {
        this.allOrders.set(orders);
      });

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const orderId = params.get('orderId')?.trim();
        if (orderId) {
          this.selectedOrderId.set(orderId);
        }
      });

    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value as StatusFilter);
    this.currentPage.set(1);
  }

  onSortChange(value: string): void {
    this.sortOrder.set(value as SortOrder);
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  statusClass(status: OrderStatus): string {
    return orderStatusBadgeClass(status);
  }

  formatDate = formatOrderDate;
  formatMoney = formatOrderMoney;
  itemLabel = formatOrderItemLabel;

  viewDetails(orderId: string): void {
    this.selectedOrderId.set(orderId);
  }

  closeDetails(): void {
    this.selectedOrderId.set(null);
  }

  retryLoad(): void {
    this.loadError.set(null);
    this.loadOrders(true);
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src = this.fallbackImage;
    }
  }

  private loadOrders(forceRefresh = false): void {
    if (!this.isAuthenticated()) {
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    this.orderService
      .ensureOrdersLoaded(forceRefresh)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('[OrdersPage] loadOrders error:', err);
          const message = this.orderService.getErrorMessage(err);
          this.loadError.set(message);
          this.toastr.error(message, 'Orders', {
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
