import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { type UUID } from 'crypto';
import { BaseEntity } from '../../common/entities/base.entity';
import { Order } from '../../orders/entities/order.entity';

export enum ShipmentStatus {
  IN_PREPARATION = 'En preparacion',
  SHIPPED = 'Enviado',
  DELIVERED = 'Entregado',
}

@Entity('shipments')
export class Shipment extends BaseEntity {
  @Column({ type: 'uuid', unique: true, name: 'order_id' })
  orderId: UUID;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: UUID;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.IN_PREPARATION,
  })
  status: ShipmentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  courier?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'tracking_number',
  })
  trackingNumber?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'shipped_at' })
  shippedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'delivered_at' })
  deliveredAt?: Date;

  @OneToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
