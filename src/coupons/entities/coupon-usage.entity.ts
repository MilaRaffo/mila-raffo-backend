import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Coupon } from './coupon.entity';
import { User } from '../../users/entities/user.entity';
import { type UUID } from 'crypto';

@Entity('coupon_usage')
export class CouponUsage extends BaseEntity {
  @Column({ type: 'uuid', name: 'coupon_id' })
  couponId: UUID;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: UUID;

  @Column({ type: 'uuid', nullable: true, name: 'order_id' })
  orderId?: UUID;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_applied' })
  discountApplied: number;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
