import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserAddress, UserProfile } from '../models/profile.models';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly profileBaseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/Profile`;

  /** GET /api/Profile */
  getProfile(): Observable<UserProfile> {
    return this.http.get<unknown>(this.profileBaseUrl).pipe(
      map((res) => this.extractProfile(res)),
      catchError((err) => this.handleError(err))
    );
  }

  /** PUT /api/Profile */
  updateProfile(profile: UserProfile): Observable<UserProfile> {
    return this.http.put<unknown>(this.profileBaseUrl, profile).pipe(
      map((res) => this.extractProfile(res)),
      catchError((err) => this.handleError(err))
    );
  }

  /** GET /api/Profile/addresses */
  getAddresses(): Observable<UserAddress[]> {
    return this.http.get<unknown>(`${this.profileBaseUrl}/addresses`).pipe(
      map((res) => this.extractAddresses(res)),
      catchError((err) => this.handleError(err))
    );
  }

  /** POST /api/Profile/addresses */
  addAddress(address: UserAddress): Observable<UserAddress> {
    return this.http.post<unknown>(`${this.profileBaseUrl}/addresses`, address).pipe(
      map((res) => this.extractAddress(res)),
      catchError((err) => this.handleError(err))
    );
  }

  /** PUT /api/Profile/addresses/{addressId} */
  updateAddress(addressId: string, address: UserAddress): Observable<UserAddress> {
    const url = `${this.profileBaseUrl}/addresses/${encodeURIComponent(addressId)}`;
    return this.http.put<unknown>(url, address).pipe(
      map((res) => this.extractAddress(res)),
      catchError((err) => this.handleError(err))
    );
  }

  /** DELETE /api/Profile/addresses/{addressId} */
  deleteAddress(addressId: string): Observable<unknown> {
    const url = `${this.profileBaseUrl}/addresses/${encodeURIComponent(addressId)}`;
    return this.http.delete<unknown>(url).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  private extractProfile(res: unknown): UserProfile {
    const data = this.unwrapPayload(res);
    return {
      firstName: String(data['firstName'] ?? data['FirstName'] ?? ''),
      lastName: String(data['lastName'] ?? data['LastName'] ?? ''),
      email: String(data['email'] ?? data['Email'] ?? ''),
      phoneNumber: String(data['phoneNumber'] ?? data['PhoneNumber'] ?? ''),
      dateOfBirth: data['dateOfBirth'] || data['DateOfBirth']
        ? String(data['dateOfBirth'] ?? data['DateOfBirth']).split('T')[0]
        : undefined,
    };
  }

  private extractAddresses(res: unknown): UserAddress[] {
    const unwrapped = this.unwrapPayload(res);
    let rawList: unknown[] = [];
    if (Array.isArray(unwrapped)) {
      rawList = unwrapped;
    } else if (unwrapped && typeof unwrapped === 'object') {
      const keys = ['items', 'Items', 'addresses', 'Addresses', 'data', 'Data'];
      for (const key of keys) {
        const v = (unwrapped as Record<string, unknown>)[key];
        if (Array.isArray(v)) {
          rawList = v;
          break;
        }
      }
    } else if (Array.isArray(res)) {
      rawList = res;
    }

    return rawList.map((item) => this.extractAddress(item));
  }

  private extractAddress(res: unknown): UserAddress {
    const data = this.unwrapPayload(res);
    return {
      id: data['id'] || data['Id'] || data['addressId'] || data['AddressId']
        ? String(data['id'] ?? data['Id'] ?? data['addressId'] ?? data['AddressId'])
        : undefined,
      fullName: String(data['fullName'] ?? data['FullName'] ?? ''),
      phoneNumber: String(data['phoneNumber'] ?? data['PhoneNumber'] ?? ''),
      city: String(data['city'] ?? data['City'] ?? ''),
      street: String(data['street'] ?? data['Street'] ?? ''),
      building: String(data['building'] ?? data['Building'] ?? ''),
      isDefault: Boolean(data['isDefault'] ?? data['IsDefault'] ?? false),
    };
  }

  private unwrapPayload(obj: unknown): Record<string, unknown> {
    if (!obj || typeof obj !== 'object') {
      return {};
    }
    const rec = obj as Record<string, unknown>;
    const keys = ['data', 'Data', 'result', 'Result', 'value', 'Value'];
    for (const key of keys) {
      const inner = rec[key];
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        return inner as Record<string, unknown>;
      }
    }
    return rec;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('[ProfileService] error:', error);
    const backendMessage =
      (error.error as { message?: string; title?: string })?.message ??
      (error.error as { message?: string; title?: string })?.title;

    const message =
      backendMessage ??
      (typeof error.error === 'string' ? error.error : null) ??
      'An unexpected error occurred in Profile Service.';

    return throwError(() => new Error(message));
  }
}
