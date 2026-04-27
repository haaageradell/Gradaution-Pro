import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrl: './filter-sidebar.component.css',
})
export class FilterSidebarComponent {
  sections = {
    category: true,
    color: true,
    price: true,
    discount: true,
  };

  categories = ['Sunglasses', 'Eyeglasses', "Men's Glasses", "Women's Glasses"];
  selectedPrice = 5000;
  selectedDiscount = 25;

  toggle(section: keyof FilterSidebarComponent['sections']): void {
    this.sections[section] = !this.sections[section];
  }
}
