import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  signal,
  effect,
} from "@angular/core";
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { CommonModule } from "@angular/common";

import { Product } from "../../models/product.model";
import { CategoryService } from "../../services/category.service";

type ProductFormValue = {
  name: string;
  categoryId: string | null;
  description: string;
  price: number;
  costPrice: number;
  quantityInStock: number;
  minStockLevel: number;
  reorderQuantity: number;
};

@Component({
  selector: "app-product-form",
  templateUrl: "./product-form.component.html",
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent {
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  product = input<Product | null | undefined>(null);
  save = output<Omit<Product, "id"> | Product>();
  cancel = output<void>();

  isEditMode = false;

  categories = this.categoryService.categories;
  isAddingCategory = signal(false);
  newCategoryName = signal("");

  // Strongly typed, non-nullable form
  productForm = this.fb.nonNullable.group(
    {
      name: ["", Validators.required],
      categoryId: [null as string | null, Validators.required], // ✅
      description: [""],
      price: [0, [Validators.required, Validators.min(0.01)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      quantityInStock: [0, [Validators.required, Validators.min(0)]],
      minStockLevel: [0, [Validators.required, Validators.min(0)]],
      reorderQuantity: [1, [Validators.required, Validators.min(1)]],
    },
    { validators: [this.costNotAbovePriceValidator] },
  );

  constructor() {
    this.categoryService.load();
    // React to input changes (not just first init)
    effect(() => {
      const p = this.product();
      this.isEditMode = !!p;

      if (p) {
        this.productForm.patchValue({
          name: p.name ?? "",
          categoryId: p.categoryId ?? null,
          description: p.description ?? "",
          price: Number(p.price ?? 0),
          costPrice: Number(p.costPrice ?? 0),
          quantityInStock: Number(p.quantityInStock ?? 0),
          minStockLevel: Number(p.minStockLevel ?? 0),
          reorderQuantity: Number(p.reorderQuantity ?? 1),
        });
      } else {
        // Reset to defaults for "Add"
        this.productForm.reset({
          name: "",
          categoryId: null,
          description: "",
          price: 0,
          costPrice: 0,
          quantityInStock: 0,
          minStockLevel: 0,
          reorderQuantity: 1,
        });
      }

      // Close "add category" UI when switching modes
      this.isAddingCategory.set(false);
      this.newCategoryName.set("");
    });
  }

  addNewCategory(): void {
    const newCat = this.newCategoryName().trim();
    if (!newCat) return;

    this.categoryService.create(newCat).subscribe({
      next: (created) => {
        // select the created category by id
        this.productForm.controls.categoryId.setValue(created.id);

        // close UI
        this.isAddingCategory.set(false);
        this.newCategoryName.set("");
      },
      error: (err) => {
        // optional: handle 409 duplicate name etc.
        console.error(err);
      },
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const raw = this.productForm.getRawValue();

    const dto: ProductFormValue = {
      ...raw,
      price: Number(raw.price),
      costPrice: Number(raw.costPrice),
      quantityInStock: Number(raw.quantityInStock),
      minStockLevel: Number(raw.minStockLevel),
      reorderQuantity: Number(raw.reorderQuantity),
    };

    if (this.isEditMode) {
      const existing = this.product();
      if (!existing) return;

      // Only keep id from existing, do NOT spread existing object
      this.save.emit({ id: existing.id, ...dto });
    } else {
      this.save.emit(dto);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private costNotAbovePriceValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const price = Number(control.get("price")?.value);
    const cost = Number(control.get("costPrice")?.value);
    if (!Number.isFinite(price) || !Number.isFinite(cost)) return null;
    return cost > price ? { costAbovePrice: true } : null;
  }
}
