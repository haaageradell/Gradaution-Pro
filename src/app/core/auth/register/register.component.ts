import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest, RegisterResponse } from '../../models/auth.models';
import { catchError, finalize, throwError } from 'rxjs';

const PASSWORD_COMPLEXITY_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

interface BackendRegisterPayload {
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  Password: string;
  ConfirmPassword: string;
}

function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (password == null || confirmPassword == null) return null;
    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  signupForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  isLoading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.signupForm = this.fb.nonNullable.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: [
          '',
          [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]{10,}$/)],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.pattern(PASSWORD_COMPLEXITY_PATTERN),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator() },
    );
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.isLoading) return;

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    const { firstName, lastName, email, phone, password, confirmPassword } =
      this.signupForm.getRawValue();

    const payload: BackendRegisterPayload = {
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      PhoneNumber: phone,
      Password: password,
      ConfirmPassword: confirmPassword,
    };

    this.authService
      .register(payload as unknown as RegisterRequest)
      .pipe(
        catchError((error: Error) => {
          this.errorMessage = error.message;
          console.error('Register failed:', error);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response: RegisterResponse) => {
          // console.log('REGISTER RESPONSE', response);
          const savedToken = this.authService.persistAuthToken(response);
          // console.log('TOKEN SAVED', savedToken ?? '(none)');
          if (savedToken) {
            this.router.navigate(['/home']);
            return;
          }
          this.router.navigate(['/login']);
        },
        error: () => {},
      });
  }
}
