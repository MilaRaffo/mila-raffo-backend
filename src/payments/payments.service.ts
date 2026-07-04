import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpException,
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
import { CulqiService } from './culqi/culqi.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly ordersService: OrdersService,
    private readonly logger: LoggerService,
    private readonly culqiService: CulqiService,
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
      relations: ['user'],
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

    const savedPayment = await this.getOrCreatePayment(
      createPaymentDto,
      order,
      userId,
    );

    // Procesar pago según el método
    if (method === PaymentMethod.TEST) {
      return this.processTestPayment(savedPayment.id);
    }

    if (method === PaymentMethod.CULQI) {
      return this.processCulqiPayment(savedPayment, order, createPaymentDto);
    }

    // Aquí se integrarían otros métodos de pago reales
    // Por ahora, solo devolvemos el pago pendiente
    return this.findOne(savedPayment.id, userId);
  }

  private async getOrCreatePayment(
    createPaymentDto: CreatePaymentDto,
    order: Order,
    userId: UUID,
  ): Promise<Payment> {
    if (
      createPaymentDto.method === PaymentMethod.CULQI &&
      createPaymentDto.authentication3DS
    ) {
      const pendingPayment = await this.paymentRepository.findOne({
        where: {
          orderId: order.id,
          userId,
          method: PaymentMethod.CULQI,
          status: PaymentStatus.PENDING,
        },
        order: { createdAt: 'DESC' },
      });

      if (!pendingPayment) {
        throw new BadRequestException(
          'No pending Culqi payment was found for 3DS authentication',
        );
      }
      return pendingPayment;
    }

    const payment = this.paymentRepository.create({
      orderId: order.id,
      userId,
      amount: order.total,
      method: createPaymentDto.method,
      status: PaymentStatus.PENDING,
    });
    return this.paymentRepository.save(payment);
  }

  private async processCulqiPayment(
    payment: Payment,
    order: Order,
    createPaymentDto: CreatePaymentDto,
  ): Promise<Record<string, unknown>> {
    const {
      sourceId,
      deviceFingerprintId,
      installments = 0,
      authentication3DS,
    } = createPaymentDto;

    if (!sourceId || !deviceFingerprintId) {
      throw new BadRequestException(
        'A Culqi token and device fingerprint are required',
      );
    }

    payment.status = PaymentStatus.PROCESSING;
    await this.paymentRepository.save(payment);

    try {
      const result = await this.culqiService.createCharge({
        amount: this.toCents(order.total),
        currency_code: 'PEN',
        email: order.user.email,
        source_id: sourceId,
        installments,
        antifraud_details: {
          first_name: order.billingFirstName,
          last_name: order.billingLastName,
          phone_number: order.billingPhone,
          device_finger_print_id: deviceFingerprintId,
        },
        authentication_3DS: authentication3DS,
      });

      payment.transactionId = result.charge.id;
      payment.metadata = {
        provider: 'culqi',
        requires3DS: result.requires3DS,
        charge: result.charge,
      };

      if (result.requires3DS) {
        payment.status = PaymentStatus.PENDING;
        payment.paymentGatewayResponse = 'Culqi 3DS authentication required';
      } else {
        payment.status = PaymentStatus.COMPLETED;
        payment.paymentGatewayResponse = 'Culqi charge completed successfully';
        payment.processedAt = new Date();
        await this.ordersService.updatePaymentStatus(
          payment.orderId,
          OrderPaymentStatus.PAID,
        );
      }

      await this.paymentRepository.save(payment);
      this.logger.paymentProcessed(
        payment.id,
        payment.orderId,
        payment.amount,
        result.requires3DS ? 'pending_3ds' : 'completed',
      );

      return this.findOne(payment.id, payment.userId, true);
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.errorMessage = this.getPaymentErrorMessage(error);
      payment.paymentGatewayResponse = 'Culqi charge failed';
      await this.paymentRepository.save(payment);
      await this.ordersService.updatePaymentStatus(
        payment.orderId,
        OrderPaymentStatus.FAILED,
      );

      this.logger.warn('Culqi payment failed', {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
      });

      throw error;
    }
  }

  private toCents(amount: number): number {
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isSafeInteger(cents) || cents <= 0) {
      throw new BadRequestException('Order total is invalid');
    }
    return cents;
  }

  private getPaymentErrorMessage(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = response.message;
        return Array.isArray(message) ? message.join(', ') : String(message);
      }
    }
    return 'Payment processing failed';
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

    if (payment.method === PaymentMethod.CULQI) {
      if (!payment.transactionId) {
        throw new BadRequestException('The Culqi charge ID is missing');
      }
      const refund = await this.culqiService.createRefund(
        payment.transactionId,
        this.toCents(payment.amount),
      );
      payment.metadata = {
        ...payment.metadata,
        refund,
      };
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

  async handleCulqiWebhook(
    payload: unknown,
  ): Promise<{ received: boolean; duplicate?: boolean }> {
    const eventId = this.getWebhookEventId(payload);
    const event = await this.culqiService.getEvent(eventId);
    const charge = this.parseWebhookCharge(event.data);

    if (!charge.id) {
      throw new BadRequestException('Culqi event does not contain a charge');
    }

    const payment = await this.paymentRepository.findOne({
      where: { transactionId: charge.id, method: PaymentMethod.CULQI },
    });
    if (!payment) {
      this.logger.warn('Culqi webhook does not match a local payment', {
        eventId,
        chargeId: charge.id,
      });
      return { received: true };
    }

    const processedEventIds = Array.isArray(payment.metadata?.processedEventIds)
      ? (payment.metadata.processedEventIds as string[])
      : [];
    if (processedEventIds.includes(event.id)) {
      return { received: true, duplicate: true };
    }

    if (
      event.type === 'charge.creation.succeeded' ||
      event.type === 'charge.capture.succeeded'
    ) {
      payment.status = PaymentStatus.COMPLETED;
      payment.processedAt = payment.processedAt ?? new Date();
      await this.ordersService.updatePaymentStatus(
        payment.orderId,
        OrderPaymentStatus.PAID,
      );
    } else if (
      event.type === 'charge.creation.failed' ||
      event.type === 'charge.capture.failed' ||
      event.type === 'charge.expired'
    ) {
      payment.status = PaymentStatus.FAILED;
      payment.errorMessage =
        charge.outcome?.user_message ?? 'Culqi reported a failed charge';
      await this.ordersService.updatePaymentStatus(
        payment.orderId,
        OrderPaymentStatus.FAILED,
      );
    } else {
      return { received: true };
    }

    payment.metadata = {
      ...payment.metadata,
      charge,
      processedEventIds: [...processedEventIds, event.id],
    };
    await this.paymentRepository.save(payment);
    return { received: true };
  }

  private getWebhookEventId(payload: unknown): string {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('id' in payload) ||
      typeof payload.id !== 'string' ||
      !payload.id.startsWith('evt_')
    ) {
      throw new BadRequestException('Invalid Culqi webhook event');
    }
    return payload.id;
  }

  private parseWebhookCharge(
    data: Record<string, unknown> | string,
  ): import('./culqi/culqi.service').CulqiChargeResponse {
    if (typeof data === 'string') {
      try {
        return JSON.parse(
          data,
        ) as import('./culqi/culqi.service').CulqiChargeResponse;
      } catch {
        throw new BadRequestException('Invalid Culqi webhook data');
      }
    }
    return data;
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
