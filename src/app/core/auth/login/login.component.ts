import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.models';
import { catchError, finalize, throwError } from 'rxjs';

const PASSWORD_COMPLEXITY_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  rememberMe = false;
  errorMessage = '';
  isLoading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {
    this.loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.pattern(PASSWORD_COMPLEXITY_PATTERN)],
      ],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.isLoading) return;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    const payload: LoginRequest = this.loginForm.getRawValue();

    this.authService
      .login(payload)
      .pipe(
        catchError((error: Error) => {
          this.errorMessage = error.message;
          console.error('Login failed:', error);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          // console.log('LOGIN RESPONSE:', response);
          const token = this.authService.extractJwtFromAuthResponse(response);
          if (isPlatformBrowser(this.platformId) && token) {
            localStorage.setItem('token', token);
          }
          // console.log('TOKEN SAVED:', token);
          if (!token) {
            this.errorMessage =
              'Login succeeded but the server did not return a token. Please try again or contact support.';
            return;
          }
          this.router.navigate(['/home']);
        },
        error: () => {},
      });
  }
}
