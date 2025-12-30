import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../../categories/entities/category.entity';
import { type UUID } from 'crypto';

@Entity('product_categories')
export class ProductCategory {
  @PrimaryColumn({ name: 'product_id' })
  productId: UUID;

  @PrimaryColumn({ name: 'category_id' })
  categoryId: UUID;

  @ManyToOne(() => Product, (product) => product.productCategories)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Category, (category) => category.productCategories)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
