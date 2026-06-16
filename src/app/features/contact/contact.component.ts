import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);
  private readonly toastr = inject(ToastrService);

  contactForm!: FormGroup;

  readonly isLoading = signal(false);
  readonly isSubmitted = signal(false);

  readonly countries = ['Egypt', 'Saudi Arabia', 'UAE', 'Kuwait', 'USA', 'Other'];
  readonly inquiryTypes = ['Inquiry', 'Order support', 'Return request', 'Feedback', 'Other'];
  readonly reasons = ['General Question', 'Sizing / Fitting', 'Shipping delay', 'Refund request', 'Website issue', 'Other'];

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      orderNumber: [''],
      country: ['Egypt', Validators.required],
      type: ['Inquiry', Validators.required],
      reason: ['General Question', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    this.isLoading.set(true);
    const payload = this.contactForm.value;

    this.contactService.sendContactMessage(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSubmitted.set(true);
        this.toastr.success('Your message has been sent successfully!', 'Message Sent');
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.toastr.error(err.message || 'Could not send message. Please try again.', 'Submission Error');
      },
    });
  }

  resetForm(): void {
    this.isSubmitted.set(false);
    this.contactForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      orderNumber: '',
      country: 'Egypt',
      type: 'Inquiry',
      reason: 'General Question',
      message: '',
    });
  }

  // Helpers for validation styling and feedback
  isInvalid(controlName: string): boolean {
    const control = this.contactForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
