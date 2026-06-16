import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-profile-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl border border-[#ECE8F3] p-6 shadow-sm flex flex-col gap-6">
      <div class="border-b border-[#F6F4F8] pb-4 flex flex-col gap-1">
        <h3 class="text-xl font-bold text-[#2D2340]">{{ title }}</h3>
        <p *ngIf="description" class="text-xs text-[#9D93AF]">{{ description }}</p>
      </div>
      <div class="flex-1">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class ProfileSectionComponent {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
}
