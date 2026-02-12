export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  supplier?: string | null;
  price: number;
  costPrice: number;
  quantityInStock: number;
  minStockLevel: number;
  reorderQuantity: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateProductDto = Omit<Product, "id" | "createdAt" | "updatedAt">;
export type UpdateProductDto = Partial<CreateProductDto>;
