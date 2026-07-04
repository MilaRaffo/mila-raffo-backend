import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ProductCharacteristic } from '../../products/entities/product-characteristic.entity';
import {
  DataType,
  Measureunits,
} from '../../common/enums/characteristics.enum';

@Entity('characteristics')
export class Characteristic extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: DataType,
    name: 'data_type',
  })
  dataType: DataType;

  @Column({ type: 'enum', enum: Measureunits, nullable: true })
  units?: Measureunits;

  @OneToMany(
    () => ProductCharacteristic,
    (productCharacteristic) => productCharacteristic.characteristic,
  )
  productCharacteristics: ProductCharacteristic[];
}
