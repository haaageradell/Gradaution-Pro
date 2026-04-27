import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ResetPasswordRequest } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';

const PASSWORD_COMPLEXITY_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (newPassword == null || confirmPassword == null) {
      return null;
    }

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  resetPasswordForm: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService
  ) {
    this.resetPasswordForm = this.fb.nonNullable.group(
      {
        email: ['', [Validators.required, Validators.email]],
        token: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_COMPLEXITY_PATTERN)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator() }
    );

    const emailFromUrl = this.route.snapshot.queryParamMap.get('email');
    const tokenFromUrl = this.route.snapshot.queryParamMap.get('token');

    if (emailFromUrl) {
      this.resetPasswordForm.patchValue({ email: emailFromUrl });
    }

    if (tokenFromUrl) {
      this.resetPasswordForm.patchValue({ token: tokenFromUrl });
    }
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload: ResetPasswordRequest = this.resetPasswordForm.getRawValue();

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Your password has been reset successfully.';
      },
      error: (error: Error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message;
      },
    });
  }
}
