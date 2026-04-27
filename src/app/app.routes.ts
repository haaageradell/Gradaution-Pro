import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';
import { BlankLayoutComponent } from './core/layouts/blank-layout/blank-layout.component';
import { LoginComponent } from './core/auth/login/login.component';
import { RegisterComponent } from './core/auth/register/register.component';
import { ForgotPasswordComponent } from './core/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './core/auth/reset-password/reset-password.component';
import { HomeComponent } from './features/home/home.component';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';
import { TryOnComponent } from './features/try-on/try-on.component';
import { FaceAnalysisComponent } from './features/face-analysis/face-analysis.component';
import { VisionTestComponent } from './features/vision-test/vision-test.component';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { ProductsComponent } from './pages/products/products.component';
import { CartPageComponent } from './features/cart/pages/cart-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent, title: 'Login Page' },
      {
        path: 'register',
        component: RegisterComponent,
        title: 'Register Page',
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
        title: 'Forgot Password Page',
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
        title: 'Reset Password Page',
      },
    ],
  },

  {
    path: '',
    component: BlankLayoutComponent,
    children: [
      { path: 'home', component: HomeComponent, title: 'Home Page' },
      { path: 'about', component: AboutComponent, title: 'About US Page' },
      {
        path: 'contact',
        component: ContactComponent,
        title: 'Contact US Page',
      },
      { path: 'try', component: TryOnComponent, title: 'Try-on Page' },
      {
        path: 'face',
        component: FaceAnalysisComponent,
        title: 'Face Analysis Page',
      },
      {
        path: 'vision',
        component: VisionTestComponent,
        title: 'Vision Test Page',
      },
      {
        path: 'products',
        component: ProductsComponent,
        title: 'Products Page',
      },
      {
        path: 'cart',
        component: CartPageComponent,
        title: 'Cart Page',
      },
    ],
  },
  { path: '**', component: NotFoundComponent, title: 'NotFound Page' },
];
