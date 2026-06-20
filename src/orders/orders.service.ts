import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Variant } from '../variants/entities/variant.entity';
import { Product } from '../products/entities/product.entity';
import { CouponsService } from '../coupons/coupons.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LoggerService } from '../common/services/logger.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { type UUID } from 'crypto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Variant)
    private readonly variantRepository: Repository<Variant>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly couponsService: CouponsService,
    private readonly notificationsService: NotificationsService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('OrdersService');
  }

  async create(
    createOrderDto: CreateOrderDto,
    userId: UUID,
  ): Promise<Record<string, unknown>> {
    const { items, shippingAddress, billingAddress, couponCode, notes } =
      createOrderDto;

    // Validar que hay items
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Obtener variantes con productos
    const variantIds = items.map((item) => item.variantId);
    const variants = await this.variantRepository.find({
      where: { id: In(variantIds) },
      relations: ['product'],
    });

    if (variants.length !== variantIds.length) {
      throw new NotFoundException('One or more variants not found');
    }

    // Verificar disponibilidad
    for (const variant of variants) {
      if (!variant.isAvailable || !variant.product.available) {
        throw new BadRequestException(
          `Product ${variant.product.name} is not available`,
        );
      }
    }

    // Calcular subtotal
    let subtotal = 0;
    const orderItems: Partial<OrderItem>[] = [];

    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) continue;

      const itemSubtotal = variant.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        variantId: variant.id,
        productName: variant.product.name,
        sku: variant.sku,
        quantity: item.quantity,
        unitPrice: variant.price,
        subtotal: itemSubtotal,
        discount: 0,
        total: itemSubtotal,
      });
    }

    // Aplicar cupón si existe
    let discountAmount = 0;
    let couponId: UUID | undefined;
    let validCouponCode: string | undefined;

    if (couponCode) {
      const validation = await this.couponsService.validateCoupon(
        couponCode,
        userId,
        subtotal,
      );

      const validatedCouponId = validation.coupon?.id;

      if (
        validation.valid &&
        validation.discount &&
        typeof validatedCouponId === 'string'
      ) {
        discountAmount = validation.discount;
        couponId = validatedCouponId as UUID;
        validCouponCode = couponCode.toUpperCase();
      }
    }

    // Calcular costos (simplificado, aquí puedes agregar lógica de envío e impuestos)
    const shippingCost = discountAmount > 0 && validCouponCode ? 0 : 10; // Gratis si hay descuento
    const taxAmount = (subtotal - discountAmount) * 0.08; // 8% tax
    const total = subtotal - discountAmount + shippingCost + taxAmount;

    // Generar número de orden único
    const orderNumber = await this.generateOrderNumber();

    // Crear orden
    const order = this.orderRepository.create({
      orderNumber,
      userId,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal,
      discountAmount,
      shippingCost,
      taxAmount,
      total,
      couponId,
      couponCode: validCouponCode,
      shippingFirstName: shippingAddress.firstName,
      shippingLastName: shippingAddress.lastName,
      shippingStreetAddress: shippingAddress.streetAddress,
      shippingApartment: shippingAddress.apartment,
      shippingCity: shippingAddress.city,
      shippingStateProvince: shippingAddress.stateProvince,
      shippingPostalCode: shippingAddress.postalCode,
      shippingCountry: shippingAddress.country,
      shippingPhone: shippingAddress.phone,
      billingFirstName: billingAddress.firstName,
      billingLastName: billingAddress.lastName,
      billingStreetAddress: billingAddress.streetAddress,
      billingApartment: billingAddress.apartment,
      billingCity: billingAddress.city,
      billingStateProvince: billingAddress.stateProvince,
      billingPostalCode: billingAddress.postalCode,
      billingCountry: billingAddress.country,
      billingPhone: billingAddress.phone,
      notes,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Crear items de orden
    const itemsToSave = orderItems.map((item) =>
      this.orderItemRepository.create({
        ...item,
        orderId: savedOrder.id,
      }),
    );

    await this.orderItemRepository.save(itemsToSave);

    // Registrar uso de cupón si se aplicó
    if (couponId && discountAmount > 0 && validCouponCode) {
      await this.couponsService.recordUsage(
        couponId,
        userId,
        savedOrder.id,
        discountAmount,
      );
      this.logger.couponUsed(validCouponCode, userId, discountAmount);
    }

    // Log de creación de orden
    this.logger.orderCreated(savedOrder.id, userId, total);
    this.logger.log(`Order created successfully`, {
      orderId: savedOrder.id,
      orderNumber,
      userId,
      itemCount: items.length,
      total,
      hasCoupon: !!couponId,
    });

    return this.findOne(savedOrder.id, userId);
  }

  async findAll(
    paginationDto: PaginationDto,
    userId?: UUID,
    isAdmin = false,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user')
      .skip(offset)
      .take(limit)
      .orderBy('order.createdAt', 'DESC');

    // Si no es admin, filtrar por usuario
    if (!isAdmin && userId) {
      queryBuilder.where('order.userId = :userId', { userId });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((order) => this.mapOrder(order)),
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
    const order = await this.findOneEntity(id, userId, isAdmin);
    return this.mapOrder(order);
  }

  private async findOneEntity(
    id: UUID,
    userId?: UUID,
    isAdmin = false,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.variant', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Verificar permisos
    if (!isAdmin && userId && order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  async findByOrderNumber(
    orderNumber: string,
    userId?: UUID,
    isAdmin = false,
  ): Promise<Record<string, unknown>> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['items', 'items.variant', 'user'],
    });

    if (!order) {
      throw new NotFoundException(
        `Order with number ${orderNumber} not found`,
      );
    }

    // Verificar permisos
    if (!isAdmin && userId && order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return this.mapOrder(order);
  }

  async update(
    id: UUID,
    updateOrderDto: UpdateOrderDto,
    userId?: UUID,
    isAdmin = false,
  ): Promise<Record<string, unknown>> {
    const order = await this.findOneEntity(id, userId, isAdmin);

    // Solo admin puede actualizar status y tracking
    if (!isAdmin && (updateOrderDto.status || updateOrderDto.trackingNumber)) {
      throw new ForbiddenException(
        'Only administrators can update order status and tracking',
      );
    }

    // Actualizar timestamps según estado
    if (updateOrderDto.status === OrderStatus.SHIPPED && !order.shippedAt) {
      order.shippedAt = new Date();
    }
    if (
      updateOrderDto.status === OrderStatus.DELIVERED &&
      !order.deliveredAt
    ) {
      order.deliveredAt = new Date();
    }

    const prevStatus = order.status;
    Object.assign(order, updateOrderDto);
    await this.orderRepository.save(order);

    const notifiableStatuses: OrderStatus[] = [
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];
    if (
      updateOrderDto.status &&
      updateOrderDto.status !== prevStatus &&
      notifiableStatuses.includes(updateOrderDto.status)
    ) {
      const statusLabel: Record<string, string> = {
        [OrderStatus.CONFIRMED]: 'confirmado',
        [OrderStatus.PROCESSING]: 'en preparación',
        [OrderStatus.SHIPPED]: 'enviado',
        [OrderStatus.DELIVERED]: 'entregado',
        [OrderStatus.CANCELLED]: 'cancelado',
      };
      void this.notificationsService.sendToUserIfOrdersEnabled(order.userId, {
        title: `Pedido #${order.orderNumber}`,
        body: `Tu pedido está ${statusLabel[updateOrderDto.status] ?? updateOrderDto.status}.`,
        data: { type: 'order_status', orderId: order.id },
      });
    }

    return this.findOne(id, userId, isAdmin);
  }

  async cancel(id: UUID, userId: UUID): Promise<Record<string, unknown>> {
    const order = await this.findOneEntity(id, userId);

    // Solo se puede cancelar si está pending o confirmed
    if (
      ![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)
    ) {
      throw new BadRequestException(
        'Only pending or confirmed orders can be cancelled',
      );
    }

    order.status = OrderStatus.CANCELLED;
    await this.orderRepository.save(order);

    void this.notificationsService.sendToUserIfOrdersEnabled(userId, {
      title: `Pedido #${order.orderNumber}`,
      body: 'Tu pedido fue cancelado.',
      data: { type: 'order_status', orderId: order.id },
    });

    return this.findOne(id, userId);
  }

  async updatePaymentStatus(
    id: UUID,
    paymentStatus: PaymentStatus,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    order.paymentStatus = paymentStatus;

    // Si el pago es exitoso, confirmar orden
    if (paymentStatus === PaymentStatus.PAID) {
      order.status = OrderStatus.CONFIRMED;
    }

    return await this.orderRepository.save(order);
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Contar órdenes del día
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :startOfDay', { startOfDay })
      .andWhere('order.createdAt <= :endOfDay', { endOfDay })
      .getCount();

    const sequence = (count + 1).toString().padStart(4, '0');

    return `ORD-${year}${month}${day}-${sequence}`;
  }

  private mapOrder(order: Order): Record<string, unknown> {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingCost: order.shippingCost,
      taxAmount: order.taxAmount,
      total: order.total,
      couponCode: order.couponCode,
      trackingNumber: order.trackingNumber,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      notes: order.notes,
      shippingAddress: {
        firstName: order.shippingFirstName,
        lastName: order.shippingLastName,
        streetAddress: order.shippingStreetAddress,
        apartment: order.shippingApartment,
        city: order.shippingCity,
        stateProvince: order.shippingStateProvince,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry,
        phone: order.shippingPhone,
      },
      billingAddress: {
        firstName: order.billingFirstName,
        lastName: order.billingLastName,
        streetAddress: order.billingStreetAddress,
        apartment: order.billingApartment,
        city: order.billingCity,
        stateProvince: order.billingStateProvince,
        postalCode: order.billingPostalCode,
        country: order.billingCountry,
        phone: order.billingPhone,
      },
      user: order.user
        ? {
            id: order.user.id,
            name: order.user.name,
            lastName: order.user.lastName,
            email: order.user.email,
          }
        : null,
      items: (order.items ?? []).map((item) => ({
        id: item.id,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        discount: item.discount,
        total: item.total,
        variant: item.variant
          ? {
              id: item.variant.id,
              sku: item.variant.sku,
            }
          : null,
      })),
    };
  }
}
