import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent {
  virtualFitImages = [
    { src: '/images/boy.png', alt: 'Man with glasses' },
    { src: '/images/us-glasses.png', alt: 'Couple with glasses' },
    { src: '/images/girl.png', alt: 'Woman with sunglasses' },
  ];
}
