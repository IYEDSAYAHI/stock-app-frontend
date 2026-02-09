export enum StockMovementType {
  Purchase = 'Purchase',
  Sale = 'Sale',
  Return = 'Return',
  Adjustment = 'Adjustment',
  Damage = 'Damage',
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  timestamp: Date;
  type: StockMovementType;
  quantityChange: number; // positive for IN, negative for OUT
  newQuantity: number;
  referenceId?: string; // e.g., invoiceId, purchaseOrderId
  notes?: string;
}
