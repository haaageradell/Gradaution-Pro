import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContactRequest } from '../models/contact.models';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly contactUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/ContactUs`;

  sendContactMessage(body: ContactRequest): Observable<unknown> {
    return this.http.post<unknown>(this.contactUrl, body).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('[ContactService] sendContactMessage error:', error);
        
        const serverMessage =
          typeof error.error === 'string'
            ? error.error
            : (error.error?.message ??
              error.error?.title ??
              error.message ??
              'Failed to submit contact message. Please try again.');

        return throwError(() => new Error(serverMessage));
      }),
    );
  }
}
