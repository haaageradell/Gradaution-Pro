import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, timer } from 'rxjs';
import { AiFaceAnalysisService, FaceAnalysisResult } from '../../core/services/ai-face-analysis.service';
import { FaceUploadComponent } from './components/face-upload/face-upload.component';
import { CameraCaptureComponent } from './components/camera-capture/camera-capture.component';
import { FaceAnalysisResultComponent } from './components/face-analysis-result/face-analysis-result.component';
import { prepareFaceImageForAnalysis } from './utils/face-image.util';

export type ScanningState = 'idle' | 'scanning' | 'done' | 'error';

@Component({
  selector: 'app-face-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FaceUploadComponent,
    CameraCaptureComponent,
    FaceAnalysisResultComponent,
  ],
  templateUrl: './face-analysis.component.html',
  host: { class: 'block' },
})
export class FaceAnalysisComponent implements OnDestroy {
  readonly activeTab = signal<'upload' | 'camera'>('upload');
  readonly selectedFile = signal<File | null>(null);
  readonly previewImageUrl = signal<string | null>(null);
  
  readonly scanningState = signal<ScanningState>('idle');
  readonly scanningMessage = signal<string>('Detecting face...');
  readonly analysisResult = signal<FaceAnalysisResult | null>(null);
  readonly errorMessage = signal<string | null>(null);

  private messageIntervalId: ReturnType<typeof setInterval> | null = null;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  // Exact text stages requested by the user
  private readonly scanningStages = [
    'Detecting face...',
    'Analyzing facial features...',
    'Determining face shape...',
    'Loading recommendations...',
  ];

  constructor(private readonly faceAnalysisService: AiFaceAnalysisService) {}

  ngOnDestroy(): void {
    this.clearMessageInterval();
  }

  setTab(tab: 'upload' | 'camera'): void {
    if (this.scanningState() === 'scanning') {
      return; // prevent tab changes during scanning
    }
    this.activeTab.set(tab);
    this.resetImageState();
  }

  onFileSelected(event: { file: File; dataUrl: string }): void {
    this.selectedFile.set(event.file);
    this.previewImageUrl.set(event.dataUrl);
    this.errorMessage.set(null);
  }

  onCameraCaptured(event: { file: File; dataUrl: string }): void {
    this.selectedFile.set(event.file);
    this.previewImageUrl.set(event.dataUrl);
    this.errorMessage.set(null);
  }

  onCameraError(errorMsg: string): void {
    this.errorMessage.set(errorMsg);
    this.scanningState.set('error');
  }

  resetImageState(): void {
    this.selectedFile.set(null);
    this.previewImageUrl.set(null);
    this.scanningState.set('idle');
    this.analysisResult.set(null);
    this.errorMessage.set(null);
    this.clearMessageInterval();
  }

  startAnalysis(): void {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Please select or capture an image first.');
      return;
    }

    if (isPlatformBrowser(this.platformId) && !localStorage.getItem('token')) {
      this.errorMessage.set(
        'Please log in to use AI face analysis. You will be redirected to the login page.',
      );
      this.scanningState.set('error');
      void this.router.navigate(['/login']);
      return;
    }

    this.scanningState.set('scanning');
    this.errorMessage.set(null);
    this.analysisResult.set(null);
    this.runMessageSequence();

    void this.runAnalysis(file);
  }

  private async runAnalysis(file: File): Promise<void> {
    try {
      const prepared = await prepareFaceImageForAnalysis(file, {
        mirror: false,
        cropCenter: this.activeTab() === 'upload',
      });

      this.previewImageUrl.set(prepared.dataUrl);
      this.selectedFile.set(prepared.file);

      forkJoin([
        this.faceAnalysisService.analyzeFace(prepared.file),
        timer(4000),
      ]).subscribe({
        next: ([result]) => {
          this.clearMessageInterval();

          if (this.isNoFaceDetected(result.faceShape)) {
            this.errorMessage.set(
              'No face was detected. Move closer, center your face in the frame, and try again with a clearer photo.',
            );
            this.scanningState.set('error');
            return;
          }

          this.analysisResult.set(result);
          this.scanningState.set('done');
        },
        error: (err: unknown) => {
          console.error('Face analysis API error:', err);
          this.clearMessageInterval();

          let msg = 'Server error. Please verify your connection or try another photo.';
          if (err instanceof Error && err.message) {
            msg = err.message;
          } else if (
            typeof err === 'object' &&
            err !== null &&
            'error' in err &&
            typeof (err as { error?: { message?: string } }).error?.message === 'string'
          ) {
            msg = (err as { error: { message: string } }).error.message;
          } else if (
            typeof err === 'object' &&
            err !== null &&
            'message' in err &&
            typeof (err as { message?: string }).message === 'string'
          ) {
            msg = (err as { message: string }).message;
          }

          this.errorMessage.set(msg);
          this.scanningState.set('error');
        },
      });
    } catch (err) {
      console.error('Face image preparation error:', err);
      this.clearMessageInterval();
      this.errorMessage.set(
        err instanceof Error
          ? err.message
          : 'Could not prepare the image for analysis. Please try another photo.',
      );
      this.scanningState.set('error');
    }
  }

  private isNoFaceDetected(faceShape: string): boolean {
    const normalized = faceShape.trim().toLowerCase();
    return (
      normalized.includes('no face') ||
      normalized === 'unknown' ||
      normalized === 'null' ||
      normalized === 'none'
    );
  }

  private runMessageSequence(): void {
    this.clearMessageInterval();
    let index = 0;
    this.scanningMessage.set(this.scanningStages[index]);

    this.messageIntervalId = setInterval(() => {
      index++;
      if (index < this.scanningStages.length) {
        this.scanningMessage.set(this.scanningStages[index]);
      } else {
        this.clearMessageInterval();
      }
    }, 1000); // cycle through 4 stages over 4 seconds
  }

  private clearMessageInterval(): void {
    if (this.messageIntervalId) {
      clearInterval(this.messageIntervalId);
      this.messageIntervalId = null;
    }
  }
}
