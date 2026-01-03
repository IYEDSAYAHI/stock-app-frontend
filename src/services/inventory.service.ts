
import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Organic Bananas', price: 0.69, quantityInStock: 150, description: 'A bunch of fresh, organic bananas.' },
  { id: 'p2', name: 'Whole Milk (1 Gallon)', price: 3.49, quantityInStock: 50, description: 'Grade A pasteurized whole milk.' },
  { id: 'p3', name: 'Artisan Sourdough Bread', price: 5.99, quantityInStock: 30, description: 'Handmade sourdough loaf.' },
  { id: 'p4', name: 'Free-Range Eggs (Dozen)', price: 4.29, quantityInStock: 80, description: 'One dozen large brown eggs.' },
  { id: 'p5', name: 'Avocado', price: 1.99, quantityInStock: 200, description: 'Hass avocado, ripe and ready.' },
  { id: 'p6', name: 'Gourmet Coffee Beans (1lb)', price: 14.99, quantityInStock: 45, description: 'Single-origin dark roast beans.' },
  { id: 'p7', name: 'Imported Olive Oil (500ml)', price: 12.50, quantityInStock: 60, description: 'Extra virgin olive oil from Italy.' },
];

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly _products = signal<Product[]>(MOCK_PRODUCTS);
  public readonly products = this._products.asReadonly();

  getProductById(id: string): Product | undefined {
    return this._products().find(p => p.id === id);
  }
  
  updateStock(productId: string, quantitySold: number): boolean {
    let success = false;
    this._products.update(products => {
        const productIndex = products.findIndex(p => p.id === productId);
        if (productIndex > -1) {
            const product = products[productIndex];
            if (product.quantityInStock >= quantitySold) {
                products[productIndex] = { ...product, quantityInStock: product.quantityInStock - quantitySold };
                success = true;
                return [...products];
            }
        }
        return products;
    });
    return success;
  }
}
