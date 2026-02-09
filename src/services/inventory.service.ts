import { Injectable, signal, inject } from '@angular/core';
import { Product } from '../models/product.model';
import { StockMovementType } from '../models/stock-movement.model';
import { StockMovementService } from './stock-movement.service';
import { NotificationService } from './notification.service';

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Organic Bananas', category: 'Produce', price: 0.69, costPrice: 0.30, quantityInStock: 150, minStockLevel: 50, reorderQuantity: 100, description: 'A bunch of fresh, organic bananas.', supplier: 'Global Fruit Co.' },
  { id: 'p2', name: 'Whole Milk (1 Gallon)', category: 'Dairy', price: 3.49, costPrice: 2.10, quantityInStock: 25, minStockLevel: 30, reorderQuantity: 40, description: 'Grade A pasteurized whole milk.', supplier: 'Local Dairy Farms' },
  { id: 'p3', name: 'Artisan Sourdough Bread', category: 'Bakery', price: 5.99, costPrice: 3.50, quantityInStock: 30, minStockLevel: 20, reorderQuantity: 25, description: 'Handmade sourdough loaf.', supplier: 'The Breadsmiths' },
  { id: 'p4', name: 'Free-Range Eggs (Dozen)', category: 'Dairy', price: 4.29, costPrice: 2.50, quantityInStock: 80, minStockLevel: 40, reorderQuantity: 50, description: 'One dozen large brown eggs.', supplier: 'Happy Hen Farms' },
  { id: 'p5', name: 'Avocado', category: 'Produce', price: 1.99, costPrice: 1.80, quantityInStock: 15, minStockLevel: 25, reorderQuantity: 100, description: 'Hass avocado, ripe and ready.', supplier: 'Global Fruit Co.' },
  { id: 'p6', name: 'Gourmet Coffee Beans (1lb)', category: 'Pantry', price: 14.99, costPrice: 9.00, quantityInStock: 45, minStockLevel: 30, reorderQuantity: 30, description: 'Single-origin dark roast beans.', supplier: 'World Coffee Importers' },
  { id: 'p7', name: 'Imported Olive Oil (500ml)', category: 'Pantry', price: 12.50, costPrice: 9.25, quantityInStock: 60, minStockLevel: 20, reorderQuantity: 40, description: 'Extra virgin olive oil from Italy.', supplier: 'Mediterranean Foods' },
];

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private stockMovementService = inject(StockMovementService);
  private notificationService = inject(NotificationService);
  private readonly _products = signal<Product[]>(MOCK_PRODUCTS);
  public readonly products = this._products.asReadonly();

  getProductById(id: string): Product | undefined {
    return this._products().find(p => p.id === id);
  }

  addProduct(productData: Omit<Product, 'id'>): void {
    const newProduct: Product = {
      ...productData,
      id: `p${Date.now()}`
    };
    this._products.update(products => [...products, newProduct]);
    this.notificationService.show(`Product "${newProduct.name}" added successfully.`, 'success');
  }

  updateProduct(updatedProduct: Product): void {
    this._products.update(products => 
      products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    this.notificationService.show(`Product "${updatedProduct.name}" updated successfully.`, 'success');
  }

  deleteProduct(productId: string): void {
    const productName = this.getProductById(productId)?.name || 'Unknown';
    this._products.update(products => products.filter(p => p.id !== productId));
    this.notificationService.show(`Product "${productName}" has been deleted.`, 'success');
  }

  deleteMultipleProducts(productIds: string[]): void {
    this._products.update(products => products.filter(p => !productIds.includes(p.id)));
    this.notificationService.show(`${productIds.length} products have been deleted.`, 'success');
  }
  
  adjustStock(productId: string, quantityChange: number, type: StockMovementType, referenceId?: string): boolean {
    let success = false;
    this._products.update(products => {
      const productIndex = products.findIndex(p => p.id === productId);
      if (productIndex === -1) {
        console.error(`Product with id ${productId} not found.`);
        return products;
      }

      const product = products[productIndex];
      const newQuantity = product.quantityInStock + quantityChange;

      if (newQuantity < 0) {
        console.error(`Not enough stock for ${product.name} to complete operation.`);
        return products;
      }
      
      const updatedProduct = { ...product, quantityInStock: newQuantity };
      products[productIndex] = updatedProduct;

      this.stockMovementService.addMovement({
        productId: product.id,
        productName: product.name,
        type,
        quantityChange,
        newQuantity,
        referenceId,
      });
      
      success = true;
      return [...products];
    });

    return success;
  }
}