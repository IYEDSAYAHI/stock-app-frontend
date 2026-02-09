import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { StockMovementService } from '../../services/stock-movement.service';
import { StockMovement, StockMovementType } from '../../models/stock-movement.model';

@Component({
  selector: 'app-stock-movements',
  templateUrl: './stock-movements.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockMovementsComponent {
  product = input.required<Product>();
  closeModal = output<void>();

  private stockMovementService = inject(StockMovementService);

  movements = computed(() => {
    return this.stockMovementService.getMovementsForProduct(this.product().id);
  });

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
