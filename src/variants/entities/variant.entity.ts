import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from '../../products/entities/product.entity';
import { Image } from '../../images/entities/image.entity';
import { VariantLeather } from './variant-leather.entity';

@Entity('variants')
export class Variant extends BaseEntity {
  @Column({ type: 'int', name: 'product_id' })
  productId: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => Product, (product) => product.variants)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(() => Image, (image) => image.variant)
  images: Image[];

  @OneToMany(() => VariantLeather, (variantLeather) => variantLeather.variant)
  variantLeathers: VariantLeather[];
}
