import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { Product } from '../../models/product.model';
import { CommonModule } from '@angular/common';
import { StockMovementsComponent } from './stock-movements.component';
import { NotificationService } from '../../services/notification.service';
import { ProductFormComponent } from './product-form.component';
import { ConfirmDeleteComponent } from '../shared/confirm-delete.component';

type InventoryTab = 'all' | 'low' | 'out' | 'highMargin';
type ModalState = { type: 'add' | 'edit' | 'delete' | 'deleteMultiple' | 'history' | null, product?: Product };

interface ProductWithProfit extends Product {
  profit: number;
  margin: number;
}

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  imports: [CommonModule, StockMovementsComponent, ProductFormComponent, ConfirmDeleteComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent {
  private inventoryService = inject(InventoryService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  
  searchTerm = signal('');
  activeTab = signal<InventoryTab>('all');
  modalState = signal<ModalState>({ type: null });
  activeMenuProductId = signal<string | null>(null);
  selectedProducts = signal<Set<string>>(new Set());
  
  allProducts = this.inventoryService.products;

  productsWithProfit = computed<ProductWithProfit[]>(() => {
    return this.allProducts().map(p => {
      const profit = p.price - p.costPrice;
      const margin = p.price > 0 ? (profit / p.price) * 100 : 0;
      return { ...p, profit, margin };
    });
  });

  lowStockProducts = computed(() => {
    return this.productsWithProfit().filter(p => p.quantityInStock <= p.minStockLevel && p.quantityInStock > 0);
  });

  outOfStockProducts = computed(() => {
    return this.productsWithProfit().filter(p => p.quantityInStock <= 0);
  });

  highMarginProducts = computed(() => {
    return this.productsWithProfit().filter(p => p.margin > 40);
  });
  
  productsForCurrentTab = computed(() => {
    switch (this.activeTab()) {
      case 'low': return this.lowStockProducts();
      case 'out': return this.outOfStockProducts();
      case 'highMargin': return this.highMarginProducts();
      default: return this.productsWithProfit();
    }
  });

  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const productsToFilter = this.productsForCurrentTab();
    if (!term) {
      return productsToFilter;
    }
    return productsToFilter.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  });

  isAllSelected = computed(() => {
    const filteredIds = this.filteredProducts().map(p => p.id);
    return filteredIds.length > 0 && filteredIds.every(id => this.selectedProducts().has(id));
  });

  toggleSelection(productId: string): void {
    this.selectedProducts.update(selection => {
      const newSelection = new Set(selection);
      if (newSelection.has(productId)) {
        newSelection.delete(productId);
      } else {
        newSelection.add(productId);
      }
      return newSelection;
    });
  }

  toggleSelectAll(): void {
    const filteredIds = this.filteredProducts().map(p => p.id);
    if (this.isAllSelected()) {
      this.selectedProducts.set(new Set());
    } else {
      this.selectedProducts.set(new Set(filteredIds));
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.selectedProducts.set(new Set()); // Clear selection on search
  }

  openModal(type: ModalState['type'], product?: Product): void {
    this.modalState.set({ type, product });
    this.closeMenu();
  }

  closeModal(): void {
    this.modalState.set({ type: null });
  }

  handleSaveProduct(productData: Omit<Product, 'id'> | Product): void {
    if ('id' in productData) {
      this.inventoryService.updateProduct(productData as Product);
    } else {
      this.inventoryService.addProduct(productData);
    }
    this.closeModal();
  }

  handleDelete(): void {
    if (this.modalState().type === 'delete' && this.modalState().product) {
      this.inventoryService.deleteProduct(this.modalState().product!.id);
    } else if (this.modalState().type === 'deleteMultiple') {
      this.inventoryService.deleteMultipleProducts(Array.from(this.selectedProducts()));
      this.selectedProducts.set(new Set());
    }
    this.closeModal();
  }

  setTab(tab: InventoryTab): void {
    this.activeTab.set(tab);
    this.searchTerm.set(''); // Reset search on tab change
    this.selectedProducts.set(new Set()); // Reset selection on tab change
  }

  createPurchaseOrder(): void {
    this.notificationService.show('Purchase Order creation feature is not yet implemented.', 'info');
  }

  toggleMenu(productId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuProductId.update(currentId => (currentId === productId ? null : productId));
  }

  closeMenu(): void {
    this.activeMenuProductId.set(null);
  }

  getProfitMarginClass(margin: number): string {
    if (margin > 40) return 'text-green-600 dark:text-green-400';
    if (margin >= 20) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  viewProductDetails(productId: string): void {
    this.router.navigate(['/inventory', productId]);
  }
}