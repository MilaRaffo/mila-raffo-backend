import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Image } from '../../images/entities/image.entity';
import { Variant } from '../../variants/entities/variant.entity';
import { type UUID } from 'crypto';

@Entity('colors')
export class Color extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 7 })
  hex: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Variant, (variant) => variant.color)
  variants: Variant[];
}
