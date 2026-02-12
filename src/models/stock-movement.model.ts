export enum StockMovementType {
  Purchase = "Purchase",
  Sale = "Sale",
  Return = "Return",
  Adjustment = "Adjustment",
  Damage = "Damage",
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantityChange: number;
  newQuantity: number;
  referenceId?: string | null;
  notes?: string | null;
  createdAt: string; // ISO
}

export interface AdjustStockDto {
  type: StockMovementType;
  quantityChange: number;
  referenceId?: string;
  notes?: string;
}
