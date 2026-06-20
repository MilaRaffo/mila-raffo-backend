import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { type UUID } from 'crypto';

export type Platform = 'ios' | 'android';

@Entity('device_tokens')
@Index(['userId', 'token'], { unique: true })
export class DeviceToken extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId: UUID;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'varchar', length: 10 })
  platform: Platform;

  @Column({ type: 'boolean', default: true, name: 'notify_offers' })
  notifyOffers: boolean;

  @Column({ type: 'boolean', default: true, name: 'notify_orders' })
  notifyOrders: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
