import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  signal,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";

import { Product } from "../../models/product.model";
import {
  StockMovement,
  StockMovementType,
} from "../../models/stock-movement.model";
import { InventoryService } from "../../services/inventory.service";
import { NotificationService } from "../../services/notification.service";

@Component({
  selector: "app-stock-movements",
  templateUrl: "./stock-movements.component.html",
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockMovementsComponent {
  product = input.required<Product>();
  closeModal = output<void>();

  private inventoryService = inject(InventoryService);
  private notification = inject(NotificationService);

  movements = signal<StockMovement[]>([]);
  loading = signal(false);

  constructor() {
    effect(() => {
      const p = this.product();
      if (!p?.id) return;

      this.loading.set(true);
      this.inventoryService.getMovementsForProduct(p.id).subscribe({
        next: (data) => this.movements.set(data),
        error: (err) => {
          console.error(err);
          this.notification.show("Failed to load stock movements.", "error");
          this.movements.set([]);
        },
        complete: () => this.loading.set(false),
      });
    });
  }

  movementTypeClass(type: StockMovementType): string {
    const mapping = {
      [StockMovementType.Sale]: "text-red-500",
      [StockMovementType.Damage]: "text-red-600",
      [StockMovementType.Purchase]: "text-green-500",
      [StockMovementType.Return]: "text-green-400",
      [StockMovementType.Adjustment]: "text-blue-500",
    };
    return mapping[type] || "text-gray-500";
  }
}
