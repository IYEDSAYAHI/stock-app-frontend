import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';
import { Product } from '../../models/product.model';
import { StockMovementService } from '../../services/stock-movement.service';
import { StockMovement, StockMovementType } from '../../models/stock-movement.model';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private inventoryService = inject(InventoryService);
  private stockMovementService = inject(StockMovementService);
  
  product = signal<Product | null>(null);

  productWithProfit = computed(() => {
    const p = this.product();
    if (!p) return null;
    const profit = p.price - p.costPrice;
    const margin = p.price > 0 ? (profit / p.price) * 100 : 0;
    return { ...p, profit, margin };
  });

  stockMovements = computed<StockMovement[]>(() => {
    const p = this.product();
    if (!p) return [];
    return this.stockMovementService.getMovementsForProduct(p.id);
  });
  
  constructor() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.product.set(this.inventoryService.getProductById(productId) ?? null);
    }
  }

  getProfitMarginClass(margin: number | undefined): string {
    if (margin === undefined) return '';
    if (margin > 40) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50';
    if (margin >= 20) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50';
  }

  getStockStatusClass(p: Product): string {
    if (p.quantityInStock <= 0) return 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900';
    if (p.quantityInStock <= p.minStockLevel) return 'text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900';
    return 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900';
  }
  
  movementTypeClass(type: StockMovementType): string {
    const mapping = {
      [StockMovementType.Sale]: 'text-red-500',
      [StockMovementType.Damage]: 'text-red-600',
      [StockMovementType.Purchase]: 'text-green-500',
      [StockMovementType.Return]: 'text-green-400',
      [StockMovementType.Adjustment]: 'text-blue-500',
    };
    return mapping[type] || 'text-gray-500';
  }
}