import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { type UUID } from 'crypto';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
}

export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  EXHAUSTED = 'exhausted',
}

@Entity('coupons')
export class Coupon extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    default: CouponType.PERCENTAGE,
  })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'minimum_purchase',
  })
  minimumPurchase?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'maximum_discount',
  })
  maximumDiscount?: number;

  @Column({ type: 'int', nullable: true, name: 'usage_limit' })
  usageLimit?: number;

  @Column({ type: 'int', default: 0, name: 'times_used' })
  timesUsed: number;

  @Column({
    type: 'int',
    nullable: true,
    name: 'usage_limit_per_user',
  })
  usageLimitPerUser?: number;

  @Column({ type: 'timestamp', nullable: true, name: 'valid_from' })
  validFrom?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'valid_until' })
  validUntil?: Date;

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  status: CouponStatus;

  @Column({ type: 'boolean', default: false, name: 'is_single_use' })
  isSingleUse: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'restricted_to_user_id' })
  restrictedToUserId?: UUID;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'restricted_to_user_id' })
  restrictedToUser?: User;
}
