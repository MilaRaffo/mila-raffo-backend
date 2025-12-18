import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Unit } from '../../units/entities/unit.entity';
import { ProductCharacteristic } from '../../products/entities/product-characteristic.entity';

export enum DataType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'bool',
}

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

  @Column({ type: 'int', nullable: true, name: 'unit_id' })
  unitId: number | null;

  @ManyToOne(() => Unit, (unit) => unit.characteristics, { nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unit?: Unit;

  @OneToMany(
    () => ProductCharacteristic,
    (productCharacteristic) => productCharacteristic.characteristic,
  )
  productCharacteristics: ProductCharacteristic[];
}
