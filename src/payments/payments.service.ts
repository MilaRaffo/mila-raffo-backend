import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { OrdersService } from '../orders/orders.service';
import { LoggerService } from '../common/services/logger.service';
import { PaymentStatus as OrderPaymentStatus } from '../orders/entities/order.entity';
import { type UUID } from 'crypto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly ordersService: OrdersService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('PaymentsService');
  }

  async create(
    createPaymentDto: CreatePaymentDto,
    userId: UUID,
  ): Promise<Record<string, unknown>> {
    const { orderId, method } = createPaymentDto;

    // Verificar que la orden existe y pertenece al usuario
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // Verificar que la orden no esté ya pagada
    if (order.paymentStatus === OrderPaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    // Crear el pago
    const payment = this.paymentRepository.create({
      orderId,
      userId,
      amount: order.total,
      method,
      status: PaymentStatus.PENDING,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Procesar pago según el método
    if (method === PaymentMethod.TEST) {
      return this.processTestPayment(savedPayment.id);
    }

    // Aquí se integrarían otros métodos de pago reales
    // Por ahora, solo devolvemos el pago pendiente
    return this.findOne(savedPayment.id, userId);
  }

  async processTestPayment(paymentId: UUID): Promise<Record<string, unknown>> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    this.logger.log('Processing test payment', {
      paymentId,
      orderId: payment.orderId,
      amount: payment.amount,
    });

    // Simular procesamiento de pago
    payment.status = PaymentStatus.PROCESSING;
    await this.paymentRepository.save(payment);

    // Simular respuesta exitosa del gateway (95% de éxito)
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      payment.status = PaymentStatus.COMPLETED;
      payment.transactionId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      payment.paymentGatewayResponse = 'Test payment completed successfully';
      payment.processedAt = new Date();

      // Actualizar estado de pago de la orden
      await this.ordersService.updatePaymentStatus(
        payment.orderId,
        OrderPaymentStatus.PAID,
      );

      this.logger.paymentProcessed(
        payment.id,
        payment.orderId,
        payment.amount,
        'completed',
      );
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.errorMessage = 'Test payment failed (simulated)';
      payment.paymentGatewayResponse = 'Insufficient funds (test)';

      // Actualizar estado de pago de la orden
      await this.ordersService.updatePaymentStatus(
        payment.orderId,
        OrderPaymentStatus.FAILED,
      );

      this.logger.warn('Test payment failed', {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        reason: 'simulated failure',
      });
    }

    await this.paymentRepository.save(payment);
    return this.findOne(payment.id, payment.userId, true);
  }

  async findAll(
    paginationDto: PaginationDto,
    userId?: UUID,
    isAdmin = false,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('payment.user', 'user')
      .skip(offset)
      .take(limit)
      .orderBy('payment.createdAt', 'DESC');

    if (!isAdmin && userId) {
      queryBuilder.where('payment.userId = :userId', { userId });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((payment) => this.mapPayment(payment)),
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
    const payment = await this.findOneEntity(id, userId, isAdmin);
    return this.mapPayment(payment);
  }

  private async findOneEntity(
    id: UUID,
    userId?: UUID,
    isAdmin = false,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order', 'user'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    if (!isAdmin && userId && payment.userId !== userId) {
      throw new ForbiddenException('You do not have access to this payment');
    }

    return payment;
  }

  async findByOrder(
    orderId: UUID,
    paginationDto: PaginationDto,
    userId?: UUID,
    isAdmin = false,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.orderId = :orderId', { orderId })
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('payment.user', 'user')
      .skip(offset)
      .take(limit)
      .orderBy('payment.createdAt', 'DESC');

    if (!isAdmin && userId) {
      queryBuilder.andWhere('payment.userId = :userId', { userId });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((payment) => this.mapPayment(payment)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async refund(id: UUID, isAdmin: boolean): Promise<Record<string, unknown>> {
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can process refunds');
    }

    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.processedAt = new Date();

    // Actualizar estado de pago de la orden
    await this.ordersService.updatePaymentStatus(
      payment.orderId,
      OrderPaymentStatus.REFUNDED,
    );

    await this.paymentRepository.save(payment);
    return this.findOne(payment.id, payment.userId, true);
  }

  // Método para webhook de pasarelas de pago (preparado para futuro)
  handleWebhook(
    provider: string,
    payload: unknown,
  ): Promise<{ received: boolean }> {
    // Aquí se manejarían webhooks de Stripe, PayPal, MercadoPago, etc.
    console.log(`Received webhook from ${provider}:`, payload);
    return Promise.resolve({ received: true });
  }

  private mapPayment(payment: Payment): Record<string, unknown> {
    return {
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      transactionId: payment.transactionId,
      paymentGatewayResponse: payment.paymentGatewayResponse,
      errorMessage: payment.errorMessage,
      processedAt: payment.processedAt,
      metadata: payment.metadata,
      order: payment.order
        ? {
            id: payment.order.id,
            orderNumber: payment.order.orderNumber,
            total: payment.order.total,
            status: payment.order.status,
            paymentStatus: payment.order.paymentStatus,
          }
        : null,
      user: payment.user
        ? {
            id: payment.user.id,
            name: payment.user.name,
            lastName: payment.user.lastName,
            email: payment.user.email,
          }
        : null,
    };
  }
}
