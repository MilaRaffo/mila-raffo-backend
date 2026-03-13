import { Entity, ManyToOne, JoinColumn,  Column } from 'typeorm';
import { Variant } from './variant.entity';
import { Leather } from '../../leathers/entities/leather.entity';
import { type UUID } from 'crypto';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('variant_leathers')
export class VariantLeather extends BaseEntity {

  @Column({ type: 'uuid', name: 'variant_id' })
  variantId: UUID;

  @Column({ type: 'uuid', name: 'leather_id' })
  leatherId: UUID;

  @ManyToOne(() => Variant, (variant) => variant.variantLeathers)
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;

  @ManyToOne(() => Leather, (leather) => leather.variantLeathers)
  @JoinColumn({ name: 'leather_id' })
  leather: Leather;
}
