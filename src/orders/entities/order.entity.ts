import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { type UUID } from 'crypto';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'order_number' })
  orderNumber: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: UUID;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'payment_status',
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'shipping_cost' })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'uuid', nullable: true, name: 'coupon_id' })
  couponId?: UUID;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'coupon_code' })
  couponCode?: string;

  // Shipping address
  @Column({ type: 'varchar', length: 100, name: 'shipping_first_name' })
  shippingFirstName: string;

  @Column({ type: 'varchar', length: 100, name: 'shipping_last_name' })
  shippingLastName: string;

  @Column({ type: 'varchar', length: 200, name: 'shipping_street_address' })
  shippingStreetAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'shipping_apartment' })
  shippingApartment?: string;

  @Column({ type: 'varchar', length: 100, name: 'shipping_city' })
  shippingCity: string;

  @Column({ type: 'varchar', length: 100, name: 'shipping_state_province' })
  shippingStateProvince: string;

  @Column({ type: 'varchar', length: 20, name: 'shipping_postal_code' })
  shippingPostalCode: string;

  @Column({ type: 'varchar', length: 100, name: 'shipping_country' })
  shippingCountry: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'shipping_phone' })
  shippingPhone?: string;

  // Billing address
  @Column({ type: 'varchar', length: 100, name: 'billing_first_name' })
  billingFirstName: string;

  @Column({ type: 'varchar', length: 100, name: 'billing_last_name' })
  billingLastName: string;

  @Column({ type: 'varchar', length: 200, name: 'billing_street_address' })
  billingStreetAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'billing_apartment' })
  billingApartment?: string;

  @Column({ type: 'varchar', length: 100, name: 'billing_city' })
  billingCity: string;

  @Column({ type: 'varchar', length: 100, name: 'billing_state_province' })
  billingStateProvince: string;

  @Column({ type: 'varchar', length: 20, name: 'billing_postal_code' })
  billingPostalCode: string;

  @Column({ type: 'varchar', length: 100, name: 'billing_country' })
  billingCountry: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'billing_phone' })
  billingPhone?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'tracking_number' })
  trackingNumber?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'shipped_at' })
  shippedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'delivered_at' })
  deliveredAt?: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];
}
