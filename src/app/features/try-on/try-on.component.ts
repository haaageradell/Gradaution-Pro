import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { AiFaceAnalysisService } from '../../core/services/ai-face-analysis.service';

@Component({
  selector: 'app-try-on',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './try-on.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TryOnComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly faceAnalysisService = inject(AiFaceAnalysisService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('photoCanvas', { static: false })
  photoCanvasRef!: ElementRef<HTMLCanvasElement>;

  readonly showSplash = signal(true);
  readonly isARStarting = signal(false);
  readonly isModelLoading = signal(false);
  readonly isPhotoProcessing = signal(false);
  readonly isStaticImageMode = signal(false);
  readonly uploadedImageSrc = signal<SafeUrl | string | null>(null);
  uploadedFile: File | null = null;
  private hasAutoStartedPhoto = false;
  readonly selectedProduct = signal<Product | null>(null);
  readonly selectedModelUrl = signal<string | null>(null);
  readonly availableProducts = signal<Product[]>([]);
  readonly errorMessage = signal<string | null>(null);

  // Lowered default coordinates so the glasses rest naturally on the nose bridge and eye line
  readonly glassesScale = signal<number>(0.085);
  readonly glassesPosition = signal<{ x: number; y: number; z: number }>({
    x: -0.003,
    y: -0.55,
    z: -0.35,
  });
  readonly glassesRotation = signal<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0,
  });

  // Getters for A-Frame string attributes
  get glassesScaleStr(): string {
    const s = this.glassesScale();
    return `${s} ${s} ${s}`;
  }

  get glassesPositionStr(): string {
    const p = this.glassesPosition();
    return `${p.x} ${p.y} ${p.z}`;
  }

  get glassesRotationStr(): string {
    const r = this.glassesRotation();
    return `${r.x} ${r.y} ${r.z}`;
  }

  // Synchronized Y-axis offset for head occluder to align arms with the glasses
  get occluderPositionStr(): string {
    const yOffset = this.glassesPosition().y - -0.15;
    const occluderY = -0.3 + yOffset;
    return `0 ${occluderY} 0.15`;
  }

  // Getter for selectedModel to match [attr.src]="selectedModel" exactly
  get selectedModel(): string | null {
    return this.selectedModelUrl();
  }

  private originalGetUserMedia: any = null;
  private drawIntervalId: any = null;
  private canvasStream: MediaStream | null = null;
  private safetyTimeoutId: any = null;

  // Track routing parameters
  private queryParamsId: number | null = null;
  private queryParamsMediaUrl: string | null = null;
  private passedProductId: number | null = null;
  private passedMediaUrl: string | null = null;
  private passedProduct: Product | null = null;

  constructor() {
    // Attempt to parse state parameters passed during route navigation
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as {
      product?: any;
      productId?: number;
      mediaUrl?: string;
    };
    if (state) {
      this.passedProduct = state.product ?? null;
      this.passedProductId = state.productId ?? state.product?.id ?? null;
      this.passedMediaUrl = state.mediaUrl ?? state.product?.mediaUrl ?? null;
      console.log('[TryOnComponent] Constructor state parsed:', state);
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Subscribe to query parameters
    this.route.queryParams.subscribe((params) => {
      const id = params['id'] || params['productId'];
      const mediaUrl = params['mediaUrl'];

      this.queryParamsId = id ? Number(id) : null;
      this.queryParamsMediaUrl = mediaUrl ? decodeURIComponent(mediaUrl) : null;

      console.log(
        '[TryOnComponent] Route parameters updated: id=',
        this.queryParamsId,
        'mediaUrl=',
        this.queryParamsMediaUrl,
      );

      if (this.availableProducts().length > 0) {
        this.initializeSelectedProduct();
      }
    });

    // Fetch catalog
    this.loadCatalog();
  }

  ngOnDestroy(): void {
    this.stopAR();
  }

  // Normalizer supporting both PascalCase and camelCase response structures
  extractProductFields(prod: any): Product {
    if (!prod) return {} as Product;
    return {
      id: prod.id ?? prod.Id ?? 0,
      name: prod.name ?? prod.Name ?? 'Eyewear Frame',
      description: prod.description ?? prod.Description ?? '',
      price: prod.price ?? prod.Price ?? 0,
      oldPrice: prod.oldPrice ?? prod.OldPrice,
      averageRating: prod.averageRating ?? prod.AverageRating,
      rating: prod.rating ?? prod.Rating,
      imageUrl: prod.imageUrl ?? prod.ImageUrl ?? '',
      thumbnailUrl: prod.thumbnailUrl ?? prod.ThumbnailUrl ?? '',
      twoDImageUrl: prod.twoDImageUrl ?? prod.TwoDImageUrl ?? '',
      brandName: prod.brandName ?? prod.BrandName ?? '',
      mediaUrl: prod.mediaUrl ?? prod.MediaUrl ?? '',
    } as Product;
  }

  extractNameFromUrl(url: string): string {
    if (!url) return 'Eyewear Frame';
    try {
      const decoded = decodeURIComponent(url);
      const filename = decoded.substring(decoded.lastIndexOf('/') + 1);
      const dotIndex = filename.lastIndexOf('.');
      const baseName =
        dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;
      return baseName.replace(/[-_]/g, ' ') || 'Eyewear Frame';
    } catch {
      return 'Eyewear Frame';
    }
  }

  loadCatalog(): void {
    console.log(
      '[TryOnComponent] Fetching product catalog from backend API...',
    );
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        // Log 1: Raw API response
        console.log('[TryOnComponent] RAW API RESPONSE:', response);

        // Log 2: response.data or response array
        const rawList = Array.isArray(response)
          ? response
          : ((response as any)?.data ?? (response as any)?.Data ?? []);
        console.log('[TryOnComponent] EXTRACTED response.data/array:', rawList);

        // Map and normalize product fields
        const mappedList = rawList.map((p: any) =>
          this.extractProductFields(p),
        );
        console.log('[TryOnComponent] MAPPED normalized products:', mappedList);

        // Filter products to ONLY include those with a valid .glb in the mediaUrl
        const filtered = mappedList.filter((prod: Product) => {
          const mUrl = String(prod.mediaUrl || '').trim();
          return mUrl.toLowerCase().includes('.glb');
        });
        console.log(
          '[TryOnComponent] FILTERED products containing mediaUrl:',
          filtered,
        );
        this.availableProducts.set(filtered);

        if (
          filtered.length === 0 &&
          !this.queryParamsId &&
          !this.passedProductId
        ) {
          console.warn('[TryOnComponent] No valid 3D models found in catalog.');
          this.errorMessage.set(
            'No 3D try-on eyewear products are currently available in the catalog.',
          );
          return;
        }

        this.initializeSelectedProduct();
      },
      error: (err) => {
        console.error('[TryOnComponent] API catalog request failed:', err);
        if (
          this.queryParamsId ||
          this.queryParamsMediaUrl ||
          this.passedProductId
        ) {
          this.initializeSelectedProduct();
        } else {
          this.errorMessage.set(
            'Failed to connect to the product database. Please try again.',
          );
        }
      },
    });
  }

  initializeSelectedProduct(): void {
    // Resolve selection sources prioritising face-analysis selection and navigation state
    const serviceSelected = this.faceAnalysisService.selectedGlasses();

    const id =
      this.queryParamsId ?? this.passedProductId ?? serviceSelected?.id ?? null;
    const mediaUrl =
      this.queryParamsMediaUrl ??
      this.passedMediaUrl ??
      serviceSelected?.mediaUrl ??
      null;
    const productObj = this.passedProduct ?? serviceSelected ?? null;

    console.log('[TryOnComponent] INITIALIZING SELECTION:', {
      id,
      mediaUrl,
      hasObj: !!productObj,
    });

    let productToSelect: Product | null = null;

    if (id || mediaUrl) {
      if (id) {
        productToSelect =
          this.availableProducts().find((p) => p.id === id) || null;
      }
      if (!productToSelect && mediaUrl) {
        productToSelect =
          this.availableProducts().find((p) => p.mediaUrl === mediaUrl) || null;
      }

      if (productToSelect) {
        this.selectedProduct.set(productToSelect);
        this.selectedModelUrl.set(productToSelect.mediaUrl || null);
        console.log(
          '[TryOnComponent] Selected model from catalog list:',
          productToSelect,
        );
        console.log(
          '[TryOnComponent] SELECTED MODEL URL:',
          productToSelect.mediaUrl,
        );
        this.checkAndAutoStartPhotoTryOn();
        return;
      }

      // If not in catalog, load directly by ID or construct fallback
      if (id) {
        console.log(
          '[TryOnComponent] Product not in catalog list. Fetching directly by ID:',
          id,
        );
        this.productService.getProductById(id).subscribe({
          next: (prod) => {
            const normalized = this.extractProductFields(prod);
            this.selectedProduct.set(normalized);
            this.selectedModelUrl.set(normalized.mediaUrl || null);
            console.log(
              '[TryOnComponent] Selected product loaded directly by ID:',
              normalized,
            );
            console.log(
              '[TryOnComponent] SELECTED MODEL URL:',
              normalized.mediaUrl,
            );
            this.checkAndAutoStartPhotoTryOn();
          },
          error: (err) => {
            console.error(
              '[TryOnComponent] Direct product detail load failed:',
              err,
            );
            const fallback: Product = {
              id: id,
              name: productObj?.name ?? this.extractNameFromUrl(mediaUrl || ''),
              price: productObj?.price ?? 0,
              mediaUrl: mediaUrl || '',
              twoDImageUrl: productObj?.twoDImageUrl ?? '',
              brandName: productObj?.brandName ?? '',
            } as Product;
            this.selectedProduct.set(fallback);
            this.selectedModelUrl.set(mediaUrl || null);
            console.log(
              '[TryOnComponent] FALLBACK SELECTED MODEL URL:',
              mediaUrl || null,
            );
            this.checkAndAutoStartPhotoTryOn();
          },
        });
        return;
      }
    }

    // Direct page access fallback
    if (this.availableProducts().length > 0) {
      productToSelect = this.availableProducts()[0];
      this.selectedProduct.set(productToSelect);
      this.selectedModelUrl.set(productToSelect.mediaUrl || null);
      console.log(
        '[TryOnComponent] Direct access fallback selected:',
        productToSelect,
      );
      console.log(
        '[TryOnComponent] SELECTED MODEL URL:',
        productToSelect.mediaUrl,
      );
      this.checkAndAutoStartPhotoTryOn();
    } else {
      console.log('[TryOnComponent] NO MODEL SELECTED.');
    }
  }

  selectProduct(product: Product): void {
    if (!product) return;
    console.log('[TryOnComponent] Switching product selection to:', product);

    this.selectedProduct.set(product);
    this.selectedModelUrl.set(product.mediaUrl || null);

    // Show loading spinner while swapping assets
    if (this.showSplash() === false) {
      if (this.isStaticImageMode()) {
        if (this.uploadedFile) {
          this.applyStaticPhotoTryOn(this.uploadedFile, product);
        }
      } else {
        this.isModelLoading.set(true);
      }
    }

    // Sync state by updating route query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        id: product.id,
        mediaUrl: product.mediaUrl || '',
      },
      queryParamsHandling: 'merge',
    });
  }

  startLiveAR(): void {
    this.isStaticImageMode.set(false);
    this.uploadedImageSrc.set(null);
    this.restoreGetUserMedia();
    this.startAR();
  }

  onPhotoUploaded(event: Event): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.uploadedFile = file;

      const product = this.selectedProduct();
      if (product) {
        this.applyStaticPhotoTryOn(file, product);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          this.uploadedImageSrc.set(
            this.sanitizer.bypassSecurityTrustUrl(result),
          );
          this.isStaticImageMode.set(true);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  applyStaticPhotoTryOn(file: File, product: Product): void {
    if (!file || !product) return;

    const glassesUrl = product.twoDImageUrl || '';
    if (!glassesUrl) {
      this.errorMessage.set(
        'The selected product does not have a 2D image preview for photo try-on.',
      );
      return;
    }

    this.isPhotoProcessing.set(true);
    this.errorMessage.set(null);
    this.showSplash.set(false);

    this.faceAnalysisService.tryOnUploadedPhoto(file, glassesUrl).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.uploadedImageSrc.set(
          this.sanitizer.bypassSecurityTrustUrl(objectUrl),
        );
        this.isStaticImageMode.set(true);
        this.isPhotoProcessing.set(false);
      },
      error: (err) => {
        console.error('[TryOnComponent] Photo try-on service failed:', err);
        this.errorMessage.set(
          'Failed to apply virtual glasses onto the photo. Please check your internet connection or try another image.',
        );
        this.isPhotoProcessing.set(false);
      },
    });
  }

  private dataURLtoFile(dataurl: string, filename: string): File | null {
    try {
      const arr = dataurl.split(',');
      if (arr.length < 2) return null;
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) return null;
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    } catch (e) {
      console.error('[TryOnComponent] Error converting dataURL to file:', e);
      return null;
    }
  }

  checkAndAutoStartPhotoTryOn(): void {
    if (this.hasAutoStartedPhoto) return;
    const cachedImg = this.faceAnalysisService.uploadedImage();
    const product = this.selectedProduct();
    if (cachedImg && product) {
      this.hasAutoStartedPhoto = true;
      console.log(
        '[TryOnComponent] Auto-starting photo try-on with cached image and product:',
        product.name,
      );

      let file: File | null = null;
      if (cachedImg.startsWith('data:')) {
        file = this.dataURLtoFile(cachedImg, 'face-analysis.jpg');
      } else {
        console.warn(
          '[TryOnComponent] Cached image is not a data URL:',
          cachedImg,
        );
      }

      if (file) {
        this.uploadedFile = file;
        this.applyStaticPhotoTryOn(file, product);
      }
    }
  }

  private overrideGetUserMedia(canvasStream: MediaStream): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.originalGetUserMedia) {
      this.originalGetUserMedia = navigator.mediaDevices.getUserMedia;
    }

    navigator.mediaDevices.getUserMedia = async (constraints) => {
      console.log(
        '[TryOnComponent] MediaDevices.getUserMedia intercepted. Returning canvas stream.',
      );
      return canvasStream;
    };
  }

  private restoreGetUserMedia(): void {
    if (isPlatformBrowser(this.platformId) && this.originalGetUserMedia) {
      navigator.mediaDevices.getUserMedia = this.originalGetUserMedia;
      this.originalGetUserMedia = null;
      console.log('[TryOnComponent] MediaDevices.getUserMedia restored.');
    }
  }

  startAR(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.showSplash.set(false);
    this.isARStarting.set(true);
    this.errorMessage.set(null);
    this.isModelLoading.set(true); // reset model downloading screen indicator

    const sceneEl = document.querySelector('a-scene') as any;
    if (sceneEl) {
      const initAR = () => {
        const faceSystem = sceneEl.systems?.['mindar-face-system'];
        if (faceSystem) {
          console.log(
            '[TryOnComponent] Initializing MindAR Face System camera...',
          );

          // Register event handlers BEFORE starting faceSystem
          const onArReady = () => {
            console.log('[TryOnComponent] MindAR Face System is ready.');
            this.isARStarting.set(false);
            this.checkAndMoveVideo();
          };

          const onArError = (err: any) => {
            console.error('[TryOnComponent] MindAR Face System error:', err);
            this.isARStarting.set(false);
            this.errorMessage.set(
              'Failed to access camera. Please check camera permissions.',
            );
            this.stopAR();
          };

          sceneEl.addEventListener('arReady', onArReady);
          sceneEl.addEventListener('arError', onArError);

          // Start tracking
          faceSystem.start();

          // Setup safety timeout to auto-clear loaders
          if (this.safetyTimeoutId) {
            clearTimeout(this.safetyTimeoutId);
          }
          this.safetyTimeoutId = setTimeout(() => {
            console.warn('[TryOnComponent] AR load safety timeout triggered.');
            if (this.isARStarting()) {
              this.isARStarting.set(false);
              this.checkAndMoveVideo();
            }
            if (this.isModelLoading()) {
              this.isModelLoading.set(false);
            }
          }, 6000);
        } else {
          console.error(
            '[TryOnComponent] mindar-face-system not registered on the scene.',
          );
          this.isARStarting.set(false);
          this.errorMessage.set('AR initialization error.');
        }
      };

      if (sceneEl.hasLoaded) {
        initAR();
      } else {
        sceneEl.addEventListener('loaded', initAR);
      }
    } else {
      console.error('[TryOnComponent] a-scene element not found in DOM!');
      this.isARStarting.set(false);
      this.errorMessage.set('AR viewer elements are missing.');
    }
  }

  private checkAndMoveVideo(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const moveVideo = () => {
      const video = document.querySelector('body > video') as HTMLVideoElement;
      const container = document.querySelector('.tryon-container');
      if (video && container) {
        console.log('[TryOnComponent] Moving webcam video inside container.');
        container.appendChild(video);

        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.zIndex = '1';

        const canvas = container.querySelector('.a-canvas') as HTMLElement;
        if (canvas) {
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.zIndex = '2';
          canvas.style.background = 'transparent';
        }

        video.onplaying = () => {
          console.log(
            '[TryOnComponent] Injected video is actively playing frames.',
          );
          this.isARStarting.set(false);
        };
      } else {
        setTimeout(moveVideo, 150);
      }
    };
    moveVideo();
  }

  stopAR(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    console.log('[TryOnComponent] Tearing down AR session.');

    if (this.safetyTimeoutId) {
      clearTimeout(this.safetyTimeoutId);
      this.safetyTimeoutId = null;
    }

    if (this.drawIntervalId) {
      clearInterval(this.drawIntervalId);
      this.drawIntervalId = null;
    }

    if (this.canvasStream) {
      this.canvasStream.getTracks().forEach((track) => track.stop());
      this.canvasStream = null;
    }

    this.restoreGetUserMedia();

    const sceneEl = document.querySelector('a-scene') as any;
    if (sceneEl) {
      const faceSystem = sceneEl.systems?.['mindar-face-system'];
      if (faceSystem) {
        faceSystem.stop();
      }
    }

    const container = document.querySelector('.tryon-container');
    if (container) {
      const videos = container.querySelectorAll('video');
      videos.forEach((vid) => {
        vid.pause();
        vid.srcObject = null;
        vid.remove();
      });
    }

    const bodyVideos = document.querySelectorAll('body > video');
    bodyVideos.forEach((vid) => {
      (vid as HTMLVideoElement).pause();
      (vid as HTMLVideoElement).srcObject = null;
      vid.remove();
    });

    // Reset signals
    this.showSplash.set(true);
    this.isARStarting.set(false);
    this.isModelLoading.set(false);
    this.isPhotoProcessing.set(false);
    this.isStaticImageMode.set(false);
    this.uploadedImageSrc.set(null);
    this.uploadedFile = null;
    this.hasAutoStartedPhoto = false;
    this.resetAdjustments();
  }

  goBack(): void {
    this.stopAR();
    if (isPlatformBrowser(this.platformId)) {
      window.history.back();
    } else {
      this.router.navigate(['/products']);
    }
  }

  onModelLoaded(): void {
    console.log('[TryOnComponent] 3D Model loaded successfully.');
    this.isModelLoading.set(false);
  }

  onModelError(event: any): void {
    console.error('[TryOnComponent] GLTF Model load error:', event);
    this.isModelLoading.set(false);
  }

  // Sizing and position adjustment methods
  adjustScale(amount: number): void {
    this.glassesScale.update((s) =>
      Math.max(0.01, Number((s + amount).toFixed(4))),
    );
  }

  adjustPositionY(amount: number): void {
    this.glassesPosition.update((p) => ({
      ...p,
      y: Number((p.y + amount).toFixed(4)),
    }));
  }

  adjustPositionZ(amount: number): void {
    this.glassesPosition.update((p) => ({
      ...p,
      z: Number((p.z + amount).toFixed(4)),
    }));
  }

  resetAdjustments(): void {
    this.glassesScale.set(0.085);
    this.glassesPosition.set({ x: -0.003, y: -0.55, z: -0.35 });
    this.glassesRotation.set({ x: 0, y: 0, z: 0 });
  }
}
