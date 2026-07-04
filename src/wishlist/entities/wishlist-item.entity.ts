import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { type UUID } from 'crypto';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Variant } from '../../variants/entities/variant.entity';

@Unique(['userId', 'variantId'])
@Entity('wishlist_items')
export class WishlistItem extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: UUID;

  @Column({ type: 'uuid', name: 'variant_id' })
  variantId: UUID;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Variant)
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;
}
