import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type UUID } from 'crypto';
import { Repository } from 'typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { Order } from '../orders/entities/order.entity';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { Shipment, ShipmentStatus } from './entities/shipment.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createForPaidOrder(order: Order): Promise<Shipment> {
    const existingShipment = await this.shipmentRepository.findOne({
      where: { orderId: order.id },
    });

    if (existingShipment) {
      return existingShipment;
    }

    const shipment = this.shipmentRepository.create({
      orderId: order.id,
      userId: order.userId,
      status: ShipmentStatus.IN_PREPARATION,
      trackingNumber: order.trackingNumber,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
    });

    return this.shipmentRepository.save(shipment);
  }

  async findAll(
    paginationDto: PaginationDto,
    userId?: UUID,
    isAdmin = false,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const queryBuilder = this.shipmentRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.order', 'order')
      .skip(offset)
      .take(limit)
      .orderBy('shipment.createdAt', 'DESC');

    if (!isAdmin && userId) {
      queryBuilder.where('shipment.userId = :userId', { userId });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((shipment) => this.mapShipment(shipment)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(
    id: UUID,
    userId?: UUID,
    isAdmin = false,
  ): Promise<Record<string, unknown>> {
    const shipment = await this.findOneEntity(id, userId, isAdmin);
    return this.mapShipment(shipment);
  }

  async findByOrder(
    orderId: UUID,
    userId?: UUID,
    isAdmin = false,
  ): Promise<Record<string, unknown>> {
    const shipment = await this.shipmentRepository.findOne({
      where: { orderId },
      relations: ['order'],
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment for order ${orderId} not found`);
    }

    if (!isAdmin && userId && shipment.userId !== userId) {
      throw new ForbiddenException('You do not have access to this shipment');
    }

    return this.mapShipment(shipment);
  }

  async update(
    id: UUID,
    updateShipmentDto: UpdateShipmentDto,
  ): Promise<Record<string, unknown>> {
    const shipment = await this.findOneEntity(id, undefined, true);
    const previousStatus = shipment.status;

    if (
      updateShipmentDto.status === ShipmentStatus.SHIPPED &&
      !shipment.shippedAt
    ) {
      shipment.shippedAt = new Date();
    }

    if (
      updateShipmentDto.status === ShipmentStatus.DELIVERED &&
      !shipment.deliveredAt
    ) {
      shipment.deliveredAt = new Date();
    }

    Object.assign(shipment, updateShipmentDto);
    await this.shipmentRepository.save(shipment);

    if (
      updateShipmentDto.status &&
      updateShipmentDto.status !== previousStatus
    ) {
      void this.notificationsService.sendToUserIfOrdersEnabled(
        shipment.userId,
        {
          title: `Pedido #${shipment.order.orderNumber}`,
          body: `Tu envio esta ${this.getStatusLabel(updateShipmentDto.status)}.`,
          data: {
            type: 'shipment_status',
            orderId: shipment.orderId,
            shipmentId: shipment.id,
          },
        },
      );
    }

    return this.findOne(id, undefined, true);
  }

  private async findOneEntity(
    id: UUID,
    userId?: UUID,
    isAdmin = false,
  ): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }

    if (!isAdmin && userId && shipment.userId !== userId) {
      throw new ForbiddenException('You do not have access to this shipment');
    }

    return shipment;
  }

  private getStatusLabel(status: ShipmentStatus): string {
    const labels: Record<ShipmentStatus, string> = {
      [ShipmentStatus.IN_PREPARATION]: 'en preparacion',
      [ShipmentStatus.SHIPPED]: 'enviado',
      [ShipmentStatus.DELIVERED]: 'entregado',
    };

    return labels[status];
  }

  private mapShipment(shipment: Shipment): Record<string, unknown> {
    return {
      id: shipment.id,
      status: shipment.status,
      courier: shipment.courier,
      trackingNumber: shipment.trackingNumber,
      shippedAt: shipment.shippedAt,
      deliveredAt: shipment.deliveredAt,
      order: shipment.order
        ? {
            id: shipment.order.id,
            orderNumber: shipment.order.orderNumber,
            status: shipment.order.status,
            paymentStatus: shipment.order.paymentStatus,
          }
        : null,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
    };
  }
}
