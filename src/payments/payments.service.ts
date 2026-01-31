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
import { PaymentStatus as OrderPaymentStatus } from '../orders/entities/order.entity';
import { type UUID } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly ordersService: OrdersService,
  ) {}

  async create(
    createPaymentDto: CreatePaymentDto,
    userId: UUID,
  ): Promise<Payment> {
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
    return savedPayment;
  }

  async processTestPayment(paymentId: UUID): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

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
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.errorMessage = 'Test payment failed (simulated)';
      payment.paymentGatewayResponse = 'Insufficient funds (test)';

      // Actualizar estado de pago de la orden
      await this.ordersService.updatePaymentStatus(
        payment.orderId,
        OrderPaymentStatus.FAILED,
      );
    }

    return await this.paymentRepository.save(payment);
  }

  async findAll(userId?: UUID, isAdmin = false) {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('payment.user', 'user')
      .orderBy('payment.createdAt', 'DESC');

    if (!isAdmin && userId) {
      queryBuilder.where('payment.userId = :userId', { userId });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: UUID, userId?: UUID, isAdmin = false): Promise<Payment> {
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
    userId?: UUID,
    isAdmin = false,
  ): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.orderId = :orderId', { orderId })
      .leftJoinAndSelect('payment.order', 'order')
      .orderBy('payment.createdAt', 'DESC');

    if (!isAdmin && userId) {
      queryBuilder.andWhere('payment.userId = :userId', { userId });
    }

    return await queryBuilder.getMany();
  }

  async refund(id: UUID, isAdmin: boolean): Promise<Payment> {
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

    return await this.paymentRepository.save(payment);
  }

  // Método para webhook de pasarelas de pago (preparado para futuro)
  async handleWebhook(
    provider: string,
    payload: any,
  ): Promise<{ received: boolean }> {
    // Aquí se manejarían webhooks de Stripe, PayPal, MercadoPago, etc.
    console.log(`Received webhook from ${provider}:`, payload);
    return { received: true };
  }
}
