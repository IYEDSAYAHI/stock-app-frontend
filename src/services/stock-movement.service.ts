import { Injectable, signal } from '@angular/core';
import { StockMovement } from '../models/stock-movement.model';

@Injectable({ providedIn: 'root' })
export class StockMovementService {
  private readonly _movements = signal<StockMovement[]>([]);
  public readonly movements = this._movements.asReadonly();

  addMovement(movementData: Omit<StockMovement, 'id' | 'timestamp'>): void {
    const newMovement: StockMovement = {
      ...movementData,
      id: `sm-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    this._movements.update(m => [newMovement, ...m]); // Prepend for chronological order
  }

  getMovementsForProduct(productId: string): StockMovement[] {
    return this._movements().filter(m => m.productId === productId);
  }
}
