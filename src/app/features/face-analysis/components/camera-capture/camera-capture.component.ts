import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-camera-capture',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block w-full' },
  template: `
    <div
      class="relative flex flex-col items-center justify-center rounded-2xl border border-[#ECE8F3] bg-white/50 p-6 shadow-sm"
    >
      <div
        class="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#2D2340] shadow-inner flex items-center justify-center"
      >
        <!-- Live Video Feed -->
        <video
          #videoElement
          *ngIf="streamActive() && !capturedImage()"
          autoplay
          playsinline
          class="h-full w-full object-cover -scale-x-100"
        ></video>

        <!-- Capture Overlay Guidelines (AI target) -->
        <div
          *ngIf="streamActive() && !capturedImage()"
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div
            class="h-3/4 w-1/2 rounded-[50%] border-2 border-dashed border-[#3d0a52]/70 shadow-[0_0_0_9999px_rgba(45,35,64,0.4)] animate-pulse"
          ></div>
          <div
            class="absolute text-xs font-semibold text-white bg-black/60 px-3 py-1 rounded-full bottom-4"
          >
            Align your face in the oval guide
          </div>
        </div>

        <!-- Captured Image Preview -->
        <img
          *ngIf="capturedImage()"
          [src]="capturedImage()"
          class="h-full w-full object-cover -scale-x-100"
          alt="Captured face preview"
        />

        <div
          *ngIf="!streamActive() && !capturedImage() && !errorMessage()"
          class="flex flex-col items-center justify-center text-center p-4"
        >
          <div
            class="h-10 w-10 animate-spin rounded-full border-4 border-[#3d0a52] border-t-transparent mb-3"
          ></div>
          <p class="text-sm font-semibold text-white/80">
            Requesting camera access...
          </p>
        </div>

        <!-- Error Panel -->
        <div
          *ngIf="errorMessage()"
          class="absolute inset-0 bg-[#2D2340]/95 flex flex-col items-center justify-center text-center p-6"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.8"
              stroke="currentColor"
              class="h-6 w-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h4 class="text-md font-bold text-white mb-2">Camera Access Error</h4>
          <p class="text-xs text-white/60 max-w-xs mb-4">
            {{ errorMessage() }}
          </p>
          <button
            class="px-4 py-2 text-xs font-semibold text-white bg-[#3d0a52] hover:bg-[#4d1368] transition-colors rounded-xl shadow-md cursor-pointer"
            (click)="startCamera()"
          >
            Retry Camera Access
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-6 flex w-full justify-center gap-4">
        <button
          *ngIf="streamActive() && !capturedImage()"
          type="button"
          class="flex items-center gap-2 px-6 py-3 font-semibold text-white bg-[#3d0a52] hover:bg-[#4d1368] hover:scale-105 active:scale-95 transition-all rounded-xl shadow-md hover:shadow-lg shadow-[#3d0a52]/20 cursor-pointer"
          (click)="capturePhoto()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="h-5 w-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
            />
          </svg>
          Capture Photo
        </button>

        <button
          *ngIf="capturedImage()"
          type="button"
          class="flex items-center gap-2 px-5 py-2.5 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 transition-colors rounded-xl cursor-pointer"
          (click)="retake()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="h-5 w-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Retake Photo
        </button>
      </div>

      <canvas #canvasElement class="hidden"></canvas>
    </div>
  `,
})
export class CameraCaptureComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  @Output() photoCaptured = new EventEmitter<{ file: File; dataUrl: string }>();
  @Output() permissionDenied = new EventEmitter<string>();

  readonly streamActive = signal(false);
  readonly capturedImage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  private mediaStream: MediaStream | null = null;

  ngOnInit(): void {
    this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera(): Promise<void> {
    this.errorMessage.set(null);
    this.streamActive.set(false);
    this.capturedImage.set(null);

    try {
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 960, min: 480 },
          facingMode: 'user',
        },
        audio: false,
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.streamActive.set(true);

      setTimeout(() => {
        if (
          this.videoElement &&
          this.videoElement.nativeElement &&
          this.mediaStream
        ) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
        }
      }, 50);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errorMsg =
        'Could not access the camera. Please check camera permissions in your browser.';
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        errorMsg =
          'Camera access was denied by the user. Please grant permission in your browser address bar.';
        this.permissionDenied.emit(errorMsg);
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError'
      ) {
        errorMsg = 'No camera device found on this system.';
      }
      this.errorMessage.set(errorMsg);
    }
  }

  capturePhoto(): void {
    if (!this.videoElement || !this.canvasElement || !this.mediaStream) {
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const sourceWidth = video.videoWidth || 1280;
      const sourceHeight = video.videoHeight || 960;

      const cropWidth = Math.round(sourceWidth * 0.72);
      const cropHeight = Math.round(sourceHeight * 0.82);
      const sx = Math.round((sourceWidth - cropWidth) / 2);
      const sy = Math.round((sourceHeight - cropHeight) / 2);

      const minShortEdge = 1024;
      const shortEdge = Math.min(cropWidth, cropHeight);
      const scale = shortEdge < minShortEdge ? minShortEdge / shortEdge : 1;

      canvas.width = Math.round(cropWidth * scale);
      canvas.height = Math.round(cropHeight * scale);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        video,
        sx,
        sy,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      this.capturedImage.set(dataUrl);

      this.stopCamera();

      const file = this.dataUrlToFile(dataUrl, 'face_capture.jpg');
      this.photoCaptured.emit({ file, dataUrl });
    }
  }

  retake(): void {
    this.capturedImage.set(null);
    this.startCamera();
  }

  private stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.streamActive.set(false);
  }

  private dataUrlToFile(dataUrl: string, fileName: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  }
}
