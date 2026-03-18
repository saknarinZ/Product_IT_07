import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '', // Default Route
    loadComponent: () => import('./features/products/product-page.component').then(m => m.ProductPageComponent)
  },
  {
    path: '**', // Fallback Route
    redirectTo: ''
  }
];
