import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  AiService,
} from '../../../../core/services/ai.service';
import { FaceAnalysisResult } from '../../../../core/models/face-analysis.model';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-face-analysis-result',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block w-full' },
  template: `
    <div class="space-y-12">
      <!-- Top Section: Shape Classification -->
      <section class="max-w-3xl mx-auto w-full">
        <!-- Shape Label Card -->
        <div
          class="rounded-2xl border border-[#ECE8F3] bg-white p-8 shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div
            class="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-[#3d0a52]/5 blur-3xl"
          ></div>

          <div>
            <h2
              class="text-xs font-bold text-[#A376A2] uppercase tracking-widest"
            >
              AI Vision Diagnosis
            </h2>
            <h1
              class="mt-4 text-4xl font-extrabold text-[#2D2340] leading-tight"
            >
              Detected Face Shape: <br />
              <span
                class="text-transparent bg-clip-text bg-gradient-to-r from-[#3d0a52] to-[#5b257d]"
              >
                {{ result.faceShape }}
              </span>
            </h1>
            <p class="mt-4 text-sm text-gray-500 leading-relaxed">
              {{ result.faceShapeDescription }}
            </p>
          </div>

          <!-- Integrity Alert -->
          <div
            class="mt-6 flex items-center gap-3 bg-[#F6F3FA] p-4 rounded-xl border border-[#ECE8F3]/40"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3d0a52]/10 text-[#3d0a52]"
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
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <p class="text-xs text-gray-500 font-medium">
              Every detail is pulled in real-time from the backend. No analysis
              information is generated locally or simulated.
            </p>
          </div>
        </div>
      </section>

      <!-- Recommendations Section -->
      <section
        class="rounded-3xl border border-[#ECE8F3] bg-white p-6 sm:p-10 shadow-sm"
      >
        <div class="mb-8 border-b border-[#ECE8F3]/60 pb-6">
          <span
            class="text-xs font-bold text-[#A376A2] uppercase tracking-widest"
            >Recommended Fitting</span
          >
          <h2 class="mt-2 text-2xl sm:text-3xl font-extrabold text-[#2D2340]">
            Matching Frames For You
          </h2>
          <p class="mt-2 text-sm text-gray-500">
            {{ result.totalResults }} frame{{
              result.totalResults === 1 ? '' : 's'
            }}
            returned by the AI model for your {{ result.faceShape }} face shape.
          </p>
        </div>

        <!-- Grid of API-Returned Glasses -->
        <div
          *ngIf="
            result.recommendedProducts && result.recommendedProducts.length > 0;
            else emptyRecommendations
          "
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <div
            *ngFor="let product of result.recommendedProducts"
            class="group flex flex-col justify-between rounded-2xl border border-[#ECE8F3] bg-white p-4 transition-all duration-300 hover:shadow-md hover:border-[#3d0a52]/25"
          >
            <!-- Product Image -->
            <div
              class="relative aspect-[4/3] w-full rounded-xl bg-[#F6F3FA] overflow-hidden flex items-center justify-center p-4"
            >
              <img
                *ngIf="productImage(product)"
                [src]="productImage(product)"
                [alt]="product.name"
                class="max-h-36 max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                (error)="handleImageError($event)"
              />
            </div>

            <!-- Details -->
            <div class="mt-4 flex-1 flex flex-col justify-between">
              <div>
                <p
                  *ngIf="product.brandName"
                  class="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3d0a52]"
                >
                  {{ product.brandName }}
                </p>
                <h4
                  class="text-sm font-bold text-[#2D2340] line-clamp-2 hover:text-[#3d0a52] transition-colors leading-tight"
                >
                  {{ product.name }}
                </h4>

                <p
                  *ngIf="product.description"
                  class="mt-1.5 text-xs text-gray-400 line-clamp-1"
                >
                  {{ product.description }}
                </p>

                <!-- Rating -->
                <div
                  *ngIf="productRating(product) > 0"
                  class="mt-2 flex items-center gap-1"
                >
                  <div class="flex text-amber-400">
                    <svg
                      *ngFor="let star of [1, 2, 3, 4, 5]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      class="h-3.5 w-3.5"
                      [class.text-gray-200]="star > productRating(product)"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.6 3.1-1.196 4.636c-.21.81.664 1.445 1.377 1.01l4.17-2.502 4.169 2.502c.713.435 1.587-.2 1.378-1.01l-1.196-4.636 3.6-3.1c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <span class="text-[9px] font-bold text-gray-400">
                    ({{ productRating(product) }})
                  </span>
                </div>
              </div>

              <!-- Pricing -->
              <div
                class="mt-3 flex items-baseline justify-between border-t border-[#ECE8F3]/40 pt-3"
              >
                <span class="text-md font-extrabold text-[#2D2340]">
                  {{ product.price | currency: 'EGP ' : 'symbol' : '1.0-0' }}
                </span>
                <span
                  *ngIf="product.oldPrice"
                  class="text-xs text-gray-400 line-through"
                >
                  {{ product.oldPrice | currency: 'EGP ' : 'symbol' : '1.0-0' }}
                </span>
              </div>
            </div>

            <!-- Fitting Actions -->
            <div class="mt-4 flex gap-2">
              <button
                type="button"
                (click)="tryOn(product)"
                class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-[#3d0a52] hover:bg-[#4d1368] transition rounded-lg shadow-sm cursor-pointer"
              >
                Try On
              </button>
              <button
                type="button"
                (click)="viewProduct(product)"
                class="flex-1 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition rounded-lg cursor-pointer"
              >
                View Details
              </button>
            </div>
          </div>
        </div>

        <!-- Dynamic Empty Template if recommendedProducts is empty -->
        <ng-template #emptyRecommendations>
          <div class="text-center py-12 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="mx-auto h-12 w-12 text-gray-300"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 12c0 5.385 4.365 9.75 9.75 9.75s9.75-4.365 9.75-9.75S17.385 2.25 12 2.25 2.25 6.615 2.25 12Z"
              />
            </svg>
            <p class="mt-4 text-sm font-semibold">
              No eyewear recommendations returned by the AI server.
            </p>
          </div>
        </ng-template>
      </section>
    </div>
  `,
})
export class FaceAnalysisResultComponent {
  @Input({ required: true }) result!: FaceAnalysisResult;
  @Input({ required: true }) imageUrl!: string;

  private readonly router = inject(Router);
  private readonly aiService = inject(AiService);

  productImage(product: Product): string {
    return this.aiService.resolveProductImage(product);
  }

  productRating(product: Product): number {
    return product.rating ?? product.averageRating ?? 0;
  }

  tryOn(product: Product): void {
    // Save state in the service for the Virtual Try-On component
    this.aiService.setTryOnState(this.result, this.imageUrl, product);
    this.router.navigate(['/try'], {
      queryParams: {
        id: product.id,
        mediaUrl: product.mediaUrl || ''
      },
      state: {
        product: product,
        productId: product.id,
        mediaUrl: product.mediaUrl || ''
      }
    });
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.style.display = 'none';
    }
  }
}
