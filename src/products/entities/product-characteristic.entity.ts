import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Product } from './product.entity';
import { Characteristic } from '../../characteristics/entities/characteristic.entity';

@Entity('product_characteristics')
export class ProductCharacteristic {
  @PrimaryColumn({ name: 'product_id' })
  productId: number;

  @PrimaryColumn({ name: 'characteristic_id' })
  characteristicId: number;

  @Column({ type: 'varchar', length: 500 })
  value: string;

  @ManyToOne(() => Product, (product) => product.productCharacteristics)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(
    () => Characteristic,
    (characteristic) => characteristic.productCharacteristics,
  )
  @JoinColumn({ name: 'characteristic_id' })
  characteristic: Characteristic;
}
