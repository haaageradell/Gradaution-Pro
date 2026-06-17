import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { EMPTY, catchError, finalize } from 'rxjs';
import {
  OrderDetail,
  OrderStatus,
  orderStatusBadgeClass,
} from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';
import { ToastrService } from 'ngx-toastr';
import {
  formatOrderDate,
  formatOrderMoney,
} from '../utils/order-format.util';

@Component({
  selector: 'app-order-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail-modal.component.html',
  styleUrl: './order-detail-modal.component.scss',
})
export class OrderDetailModalComponent implements OnChanges {
  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);

  @Input() orderId: string | null = null;
  @Output() closed = new EventEmitter<void>();

  readonly fallbackImage = 'https://picsum.photos/300/300';

  orderDetail: OrderDetail | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orderId']) {
      if (this.orderId) {
        this.loadDetail(this.orderId);
      } else {
        this.resetState();
      }
    }
  }

  statusClass(status: OrderStatus): string {
    return orderStatusBadgeClass(status);
  }

  formatDate = formatOrderDate;
  formatMoney = formatOrderMoney;

  close(): void {
    this.closed.emit();
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src = this.fallbackImage;
    }
  }

  private loadDetail(orderId: string): void {
    this.orderDetail = null;
    this.errorMessage = null;
    this.isLoading = true;

    this.orderService
      .getOrder(orderId)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('[OrderDetailModal] getOrder error:', err);
          const message = this.orderService.getErrorMessage(err);
          this.errorMessage = message;
          this.toastr.error(message, 'Order Details', {
            positionClass: 'toast-bottom-right',
          });
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (detail) => {
          if (detail?.id) {
            this.orderDetail = detail;
          } else {
            this.errorMessage = 'Order details are unavailable.';
          }
        },
      });
  }

  private resetState(): void {
    this.orderDetail = null;
    this.errorMessage = null;
    this.isLoading = false;
  }
}
