import { Entity, Column, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { type UUID } from 'crypto';

@Entity('addresses')
export class Address extends BaseEntity {
  @ManyToOne(() => User, (user) => user.addresses)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @RelationId((address: Address) => address.user)
  userId: UUID;

  @Column({ type: 'varchar', length: 200, name: 'street_address' })
  streetAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'apartment' })
  apartment?: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100, name: 'state_province' })
  stateProvince: string;

  @Column({ type: 'varchar', length: 20, name: 'postal_code' })
  postalCode: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: string;

}

