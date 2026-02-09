import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnInit {
  private categoryService = inject(CategoryService);
  // FIX: Injected FormBuilder as a class property to ensure correct type inference.
  private fb = inject(FormBuilder);

  product = input<Product | null | undefined>(null);
  save = output<Omit<Product, 'id'> | Product>();
  cancel = output<void>();

  // FIX: Initialized the form as a class property, which is cleaner and leverages the injected FormBuilder instance `fb`. This resolves the type inference issue.
  productForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    category: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    costPrice: [0, [Validators.required, Validators.min(0)]],
    quantityInStock: [0, [Validators.required, Validators.min(0)]],
    minStockLevel: [0, [Validators.required, Validators.min(0)]],
    reorderQuantity: [1, [Validators.required, Validators.min(1)]],
  });
  isEditMode = false;
  
  categories = this.categoryService.categories;
  isAddingCategory = signal(false);
  newCategoryName = signal('');

  constructor() {
    // Constructor is now clean as initialization is handled via property initializers.
  }

  ngOnInit(): void {
    const productData = this.product();
    if (productData) {
      this.isEditMode = true;
      this.productForm.patchValue(productData);
    }
  }

  addNewCategory(): void {
    const newCat = this.newCategoryName().trim();
    if (newCat) {
      this.categoryService.addCategory(newCat);
      this.productForm.get('category')?.setValue(newCat);
      this.isAddingCategory.set(false);
      this.newCategoryName.set('');
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    let formData = this.productForm.value;
    if (this.isEditMode) {
      formData = { ...this.product(), ...formData };
    }
    
    this.save.emit(formData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
