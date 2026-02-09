import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private inventoryService = inject(InventoryService);
  private invoiceService = inject(InvoiceService);

  allProducts = this.inventoryService.products;
  allInvoices = this.invoiceService.invoices;

  // --- KPI Data ---
  totalRevenue = computed(() =>
    this.allInvoices()
      .filter(i => i.status === 'Paid')
      .reduce((sum, inv) => sum + inv.totalTTC, 0)
  );
  lowStockCount = computed(() => this.allProducts().filter(p => p.quantityInStock > 0 && p.quantityInStock <= p.minStockLevel).length);
  pendingInvoicesCount = computed(() => this.allInvoices().filter(i => i.status === 'Pending').length);

  kpiData = computed(() => ({
    totalRevenue: {
      value: this.totalRevenue(),
      change: 12.5, // This remains mock data for trend indication
      changeType: 'increase' as 'increase' | 'decrease',
    },
    lowStockItems: {
      value: this.lowStockCount(),
      subtitle: 'items below threshold',
    },
    pendingInvoices: {
      value: this.pendingInvoicesCount(),
      subtitle: 'active transactions',
    },
  }));

  // --- Top Selling Products ---
  topSellingProducts = [
    { name: 'Gourmet Coffee Beans (1lb)', unitsSold: 482, trend: 'up' as 'up' | 'down' },
    { name: 'Artisan Sourdough Bread', unitsSold: 419, trend: 'down' as 'up' | 'down' },
    { name: 'Organic Bananas', unitsSold: 356, trend: 'up' as 'up' | 'down' },
    { name: 'Free-Range Eggs (Dozen)', unitsSold: 291, trend: 'up' as 'up' | 'down' },
    { name: 'Imported Olive Oil (500ml)', unitsSold: 215, trend: 'down' as 'up' | 'down' },
  ];
  maxUnitsSold = this.topSellingProducts.length > 0 ? this.topSellingProducts[0].unitsSold : 1;

  // --- Inventory Health ---
  totalProducts = computed(() => this.allProducts().length);
  outOfStockCount = computed(() => this.allProducts().filter(p => p.quantityInStock <= 0).length);
  inStockCount = computed(() => this.totalProducts() - this.lowStockCount() - this.outOfStockCount());

  inventoryHealth = computed(() => {
    const total = this.totalProducts();
    if (total === 0) {
      return { inStock: 0, lowStock: 0, outOfStock: 0 };
    }
    return {
      inStock: (this.inStockCount() / total) * 100,
      lowStock: (this.lowStockCount() / total) * 100,
      outOfStock: (this.outOfStockCount() / total) * 100,
    };
  });

  // --- Critical Alerts ---
  criticalAlerts = computed(() => {
    const out = this.allProducts()
      .filter(p => p.quantityInStock <= 0)
      .map(p => ({ ...p, status: 'Out of Stock' }));

    const low = this.allProducts()
      .filter(p => p.quantityInStock > 0 && p.quantityInStock <= p.minStockLevel)
      .map(p => ({ ...p, status: 'Low Stock' }));

    // Show Out of Stock items first, then Low Stock
    return [...out, ...low]
      .slice(0, 5) // Limit to 5 for UI
      .map(p => ({
        name: p.name,
        stockCurrent: p.quantityInStock,
        stockThreshold: p.minStockLevel,
        status: p.status,
      }));
  });
}