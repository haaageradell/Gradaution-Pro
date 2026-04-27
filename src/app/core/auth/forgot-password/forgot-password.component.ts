import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ForgotPasswordRequest } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService
  ) {
    this.forgotPasswordForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload: ForgotPasswordRequest = this.forgotPasswordForm.getRawValue();

    this.authService.forgotPassword(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'If this email exists, reset instructions were sent.';
      },
      error: (error: Error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message;
      },
    });
  }
}
