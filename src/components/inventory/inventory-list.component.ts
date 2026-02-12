import {
  Component,
  ChangeDetectionStrategy,
  effect,
  inject,
  signal,
  computed,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";

import { InventoryService } from "../../services/inventory.service";
import { NotificationService } from "../../services/notification.service";
import { Product } from "../../models/product.model";

import { StockMovementsComponent } from "./stock-movements.component";
import { ProductFormComponent } from "./product-form.component";
import { ConfirmDeleteComponent } from "../shared/confirm-delete.component";

type InventoryTab = "all" | "low" | "out" | "highMargin";
type ModalState = {
  type: "add" | "edit" | "delete" | "deleteMultiple" | "history" | null;
  product?: Product;
};

interface ProductWithProfit extends Product {
  profit: number;
  margin: number;
}

@Component({
  selector: "app-inventory-list",
  templateUrl: "./inventory-list.component.html",
  imports: [
    CommonModule,
    StockMovementsComponent,
    ProductFormComponent,
    ConfirmDeleteComponent,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent {
  private inventoryService = inject(InventoryService);
  private notificationService = inject(NotificationService);

  searchTerm = signal("");
  activeTab = signal<InventoryTab>("all");
  modalState = signal<ModalState>({ type: null });
  activeMenuProductId = signal<string | null>(null);
  selectedProducts = signal<Set<string>>(new Set());

  // backend-loaded products signal
  allProducts = this.inventoryService.products;

  // Load from backend whenever tab/search changes
  constructor() {
    effect(() => {
      const tab = this.activeTab();
      const search = this.searchTerm();

      // reset selection when query changes
      this.selectedProducts.set(new Set());

      this.inventoryService.loadProducts({
        tab,
        search,
        page: 1,
        limit: 100, // keep big for now; later add pagination UI
      });
    });

    // initial load (effect will run anyway, but explicit is fine)
    this.inventoryService.loadProducts({ tab: "all", page: 1, limit: 100 });
  }

  // ----- computed (kept mostly same) -----

  productsWithProfit = computed<ProductWithProfit[]>(() => {
    return this.allProducts().map((p) => {
      const profit = p.price - p.costPrice;
      const margin = p.price > 0 ? (profit / p.price) * 100 : 0;
      return { ...p, profit, margin };
    });
  });

  // these are now derived from the currently loaded set (not global DB counts)
  lowStockProducts = computed(() =>
    this.productsWithProfit().filter(
      (p) => p.quantityInStock <= p.minStockLevel && p.quantityInStock > 0,
    ),
  );
  outOfStockProducts = computed(() =>
    this.productsWithProfit().filter((p) => p.quantityInStock <= 0),
  );
  highMarginProducts = computed(() =>
    this.productsWithProfit().filter((p) => p.margin > 40),
  );

  // With backend tabs, the list already comes filtered.
  // Keep this simple: filteredProducts == productsWithProfit (and only client-side search if you want).
  filteredProducts = computed(() => this.productsWithProfit());

  isAllSelected = computed(() => {
    const ids = this.filteredProducts().map((p) => p.id);
    return ids.length > 0 && ids.every((id) => this.selectedProducts().has(id));
  });

  // ----- UI actions -----

  toggleSelection(productId: string): void {
    this.selectedProducts.update((selection) => {
      const next = new Set(selection);
      next.has(productId) ? next.delete(productId) : next.add(productId);
      return next;
    });
  }

  toggleSelectAll(): void {
    const ids = this.filteredProducts().map((p) => p.id);
    this.isAllSelected()
      ? this.selectedProducts.set(new Set())
      : this.selectedProducts.set(new Set(ids));
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    // effect() will reload from backend
  }

  setTab(tab: InventoryTab): void {
    this.activeTab.set(tab);
    this.searchTerm.set(""); // you can keep or remove; your choice
    // effect() will reload from backend
  }

  openModal(type: ModalState["type"], product?: Product): void {
    this.modalState.set({ type, product });
    this.closeMenu();
  }

  closeModal(): void {
    this.modalState.set({ type: null });
  }

  handleSaveProduct(productData: Omit<Product, "id"> | Product): void {
    if ("id" in productData) {
      this.inventoryService.updateProduct(productData as Product);
    } else {
      this.inventoryService.addProduct(productData);
    }
    this.closeModal();
  }

  handleDelete(): void {
    if (this.modalState().type === "delete" && this.modalState().product) {
      this.inventoryService.deleteProduct(this.modalState().product!.id);
    } else if (this.modalState().type === "deleteMultiple") {
      this.inventoryService.deleteMultipleProducts(
        Array.from(this.selectedProducts()),
      );
      this.selectedProducts.set(new Set());
    }
    this.closeModal();
  }

  createPurchaseOrder(): void {
    this.notificationService.show(
      "Purchase Order creation feature is not yet implemented.",
      "info",
    );
  }

  toggleMenu(productId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuProductId.update((currentId) =>
      currentId === productId ? null : productId,
    );
  }

  closeMenu(): void {
    this.activeMenuProductId.set(null);
  }

  getProfitMarginClass(margin: number): string {
    if (margin > 40) return "text-green-600 dark:text-green-400";
    if (margin >= 20) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  }
}
