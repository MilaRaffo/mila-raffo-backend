import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { type UUID } from 'crypto';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Variant } from '../../variants/entities/variant.entity';

@Unique(['userId', 'variantId'])
@Entity('cart_items')
export class CartItem extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: UUID;

  @Column({ type: 'uuid', name: 'variant_id' })
  variantId: UUID;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Variant)
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;
}
