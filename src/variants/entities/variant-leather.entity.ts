import { Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Variant } from './variant.entity';
import { Leather } from '../../leathers/entities/leather.entity';

@Entity('variant_leathers')
export class VariantLeather {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'variant_id' })
  variantId: number;

  @Column({ type: 'int', name: 'leather_id' })
  leatherId: number;

  @ManyToOne(() => Variant, (variant) => variant.variantLeathers)
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;

  @ManyToOne(() => Leather, (leather) => leather.variantLeathers)
  @JoinColumn({ name: 'leather_id' })
  leather: Leather;
}
