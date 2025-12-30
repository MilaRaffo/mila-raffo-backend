import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ProductCharacteristic } from '../../products/entities/product-characteristic.entity';
import { DataType, MeasureUnits } from '../../common/enums/characteristics.enum';


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

  @Column({ type: 'enum', enum: MeasureUnits})
  unit?: MeasureUnits;

  @OneToMany(
    () => ProductCharacteristic,
    (productCharacteristic) => productCharacteristic.characteristic,
  )
  productCharacteristics: ProductCharacteristic[];
}
