import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Variant } from '../../variants/entities/variant.entity';
import { type UUID } from 'crypto';

@Entity('images')
export class Image extends BaseEntity {
  @Column({ type: 'int', nullable: true, name: 'variant_id' })
  variantId: UUID | null;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  alt?: string;

  @ManyToOne(() => Variant, (variant) => variant.images, { nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant?: Variant;
}
