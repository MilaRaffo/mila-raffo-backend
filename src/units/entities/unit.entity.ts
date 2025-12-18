import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Characteristic } from '../../characteristics/entities/characteristic.entity';

@Entity('units')
export class Unit extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  symbol: string;

  @OneToMany(() => Characteristic, (characteristic) => characteristic.unit)
  characteristics: Characteristic[];
}
