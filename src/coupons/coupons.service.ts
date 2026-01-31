import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon, CouponStatus } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { type UUID } from 'crypto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private readonly couponUsageRepository: Repository<CouponUsage>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    // Verificar si el código ya existe
    const existingCoupon = await this.couponRepository.findOne({
      where: { code: createCouponDto.code.toUpperCase() },
    });

    if (existingCoupon) {
      throw new ConflictException('Coupon code already exists');
    }

    // Validar fechas si existen
    if (
      createCouponDto.validFrom &&
      createCouponDto.validUntil &&
      new Date(createCouponDto.validFrom) >=
        new Date(createCouponDto.validUntil)
    ) {
      throw new BadRequestException(
        'Valid from date must be before valid until date',
      );
    }

    const coupon = this.couponRepository.create({
      ...createCouponDto,
      code: createCouponDto.code.toUpperCase(),
    });

    return await this.couponRepository.save(coupon);
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.couponRepository.findAndCount({
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['restrictedToUser'],
    });

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: UUID): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
      relations: ['restrictedToUser'],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return coupon;
  }

  async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { code: code.toUpperCase() },
      relations: ['restrictedToUser'],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }

    return coupon;
  }

  async update(id: UUID, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);

    // Validar fechas si se actualizan
    if (
      updateCouponDto.validFrom &&
      updateCouponDto.validUntil &&
      new Date(updateCouponDto.validFrom) >=
        new Date(updateCouponDto.validUntil)
    ) {
      throw new BadRequestException(
        'Valid from date must be before valid until date',
      );
    }

    Object.assign(coupon, updateCouponDto);
    return await this.couponRepository.save(coupon);
  }

  async remove(id: UUID): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepository.softRemove(coupon);
  }

  async validateCoupon(
    code: string,
    userId: UUID,
    cartTotal: number,
  ): Promise<{
    valid: boolean;
    coupon?: Coupon;
    discount?: number;
    message?: string;
  }> {
    const coupon = await this.couponRepository.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return { valid: false, message: 'Invalid coupon code' };
    }

    // Verificar estado
    if (coupon.status !== CouponStatus.ACTIVE) {
      return { valid: false, message: 'Coupon is not active' };
    }

    // Verificar fechas
    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return { valid: false, message: 'Coupon is not yet valid' };
    }
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return { valid: false, message: 'Coupon has expired' };
    }

    // Verificar límite de uso total
    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }

    // Verificar restricción de usuario
    if (
      coupon.restrictedToUserId &&
      coupon.restrictedToUserId !== userId
    ) {
      return {
        valid: false,
        message: 'This coupon is not available for your account',
      };
    }

    // Verificar límite de uso por usuario
    if (coupon.usageLimitPerUser) {
      const usageCount = await this.couponUsageRepository.count({
        where: { couponId: coupon.id, userId },
      });

      if (usageCount >= coupon.usageLimitPerUser) {
        return {
          valid: false,
          message: 'You have reached the usage limit for this coupon',
        };
      }
    }

    // Verificar compra mínima
    if (coupon.minimumPurchase && cartTotal < coupon.minimumPurchase) {
      return {
        valid: false,
        message: `Minimum purchase of $${coupon.minimumPurchase} required`,
      };
    }

    // Calcular descuento
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (cartTotal * coupon.value) / 100;
    } else if (coupon.type === 'fixed_amount') {
      discount = coupon.value;
    } else if (coupon.type === 'free_shipping') {
      discount = 0; // Se maneja en el frontend/cálculo de envío
    }

    // Aplicar descuento máximo si existe
    if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
      discount = coupon.maximumDiscount;
    }

    return {
      valid: true,
      coupon,
      discount,
      message: 'Coupon is valid',
    };
  }

  async recordUsage(
    couponId: UUID,
    userId: UUID,
    orderId: UUID,
    discountApplied: number,
  ): Promise<void> {
    // Registrar uso
    const usage = this.couponUsageRepository.create({
      couponId,
      userId,
      orderId,
      discountApplied,
    });
    await this.couponUsageRepository.save(usage);

    // Incrementar contador de usos
    await this.couponRepository.increment({ id: couponId }, 'timesUsed', 1);

    // Actualizar estado si es de un solo uso o alcanzó límite
    const coupon = await this.couponRepository.findOne({
      where: { id: couponId },
    });

    if (coupon) {
      if (
        coupon.isSingleUse ||
        (coupon.usageLimit && coupon.timesUsed + 1 >= coupon.usageLimit)
      ) {
        coupon.status = CouponStatus.EXHAUSTED;
        await this.couponRepository.save(coupon);
      }
    }
  }

  async getUserCouponUsage(userId: UUID, couponId: UUID): Promise<number> {
    return await this.couponUsageRepository.count({
      where: { userId, couponId },
    });
  }

  async updateExpiredCoupons(): Promise<void> {
    const now = new Date();

    await this.couponRepository
      .createQueryBuilder()
      .update()
      .set({ status: CouponStatus.EXPIRED })
      .where('status = :status', { status: CouponStatus.ACTIVE })
      .andWhere('valid_until < :now', { now })
      .execute();
  }
}
