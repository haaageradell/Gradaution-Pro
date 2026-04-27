import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order } from '../models/order.interface';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly orderApiUrl = `${environment.baseUrl}/api/Order`;

  getCurrentOrder(): Observable<Order> {
    return this.http.get<Order>(this.orderApiUrl);
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.orderApiUrl}/all`);
  }

  createOrder(order: Partial<Order> = {}): Observable<Order> {
    return this.http.post<Order>(this.orderApiUrl, order);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.orderApiUrl}/${id}`);
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.orderApiUrl}/${id}/status`, { status });
  }

  applyCoupon(orderId: string, coupon: string): Observable<Order> {
    return this.http.post<Order>(`${this.orderApiUrl}/${orderId}/coupon`, {
      couponCode: coupon,
    });
  }
}
