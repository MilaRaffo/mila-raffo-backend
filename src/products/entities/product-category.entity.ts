import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('product_categories')
export class ProductCategory {
  @PrimaryColumn({ name: 'product_id' })
  productId: number;

  @PrimaryColumn({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Product, (product) => product.productCategories)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Category, (category) => category.productCategories)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
