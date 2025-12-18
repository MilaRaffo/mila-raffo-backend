import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Variant } from '../../variants/entities/variant.entity';
import { ProductCharacteristic } from './product-characteristic.entity';
import { ProductCategory } from './product-category.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'base_price' })
  basePrice: number;

  @Column({ type: 'boolean', default: true })
  available: boolean;

  @OneToMany(() => Variant, (variant) => variant.product)
  variants: Variant[];

  @OneToMany(
    () => ProductCharacteristic,
    (productCharacteristic) => productCharacteristic.product,
  )
  productCharacteristics: ProductCharacteristic[];

  @OneToMany(
    () => ProductCategory,
    (productCategory) => productCategory.product,
  )
  productCategories: ProductCategory[];
}
