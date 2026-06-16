import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal } from '@angular/core';

@Component({
  selector: 'app-face-upload',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block w-full' },
  template: `
    <div
      class="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#ECE8F3] bg-white/50 p-8 text-center transition-all duration-300 hover:border-[#3d0a52] hover:bg-[#3d0a52]/5 hover:shadow-lg hover:shadow-[#3d0a52]/5"
      [class.border-[#3d0a52]]="isDragging()"
      [class.bg-[#3d0a52]/5]="isDragging()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <div
        class="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3d0a52]/5 via-transparent to-transparent"
      ></div>

      <div
        class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F6F3FA] text-[#3d0a52] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#3d0a52] group-hover:text-white group-hover:shadow-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.8"
          stroke="currentColor"
          class="h-8 w-8"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
          />
        </svg>
      </div>

      <h3 class="mt-6 text-lg font-semibold text-[#2D2340]">
        Drag & drop your photo
      </h3>
      <p class="mt-2 text-sm text-gray-500 max-w-xs">
        or
        <span
          class="cursor-pointer font-semibold text-[#3d0a52] underline transition-colors hover:text-[#4d1368]"
          (click)="fileInput.click()"
          >browse files</span
        >
        from your device
      </p>

      <span class="mt-6 text-xs text-gray-400"
        >Supports PNG, JPG, or JPEG (Max 5MB)</span
      >

      <input
        #fileInput
        type="file"
        class="hidden"
        accept="image/png, image/jpeg, image/jpg"
        (change)="onFileSelected($event)"
      />

      <div
        *ngIf="errorMessage()"
        class="mt-4 flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="h-4 w-4"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
            clip-rule="evenodd"
          />
        </svg>
        {{ errorMessage() }}
      </div>
    </div>
  `,
})
export class FaceUploadComponent {
  @Output() fileSelected = new EventEmitter<{ file: File; dataUrl: string }>();

  readonly isDragging = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    this.errorMessage.set(null);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    this.errorMessage.set(null);

    if (files && files.length > 0) {
      this.processFile(files[0]);
      target.value = '';
    }
  }

  private processFile(file: File): void {
    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      this.errorMessage.set(
        'Unsupported file format. Please upload PNG, JPG, or JPEG.',
      );
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.errorMessage.set(
        'Image size exceeds 5MB limit. Please upload a smaller image.',
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.fileSelected.emit({ file, dataUrl });
    };
    reader.onerror = () => {
      this.errorMessage.set('Error reading image. Please try again.');
    };
    reader.readAsDataURL(file);
  }
}
