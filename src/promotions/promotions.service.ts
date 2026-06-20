import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { Promotion, PromotionStatus } from './entities/promotion.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { type UUID } from 'crypto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createPromotionDto: CreatePromotionDto,
  ): Promise<Record<string, unknown>> {
    const { productIds, categoryIds, startDate, endDate, ...promotionData } =
      createPromotionDto;

    // Validar fechas
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    const promotion = this.promotionRepository.create(promotionData);
    promotion.startDate = startDate;
    promotion.endDate = endDate;

    // Asociar productos si existen
    if (productIds && productIds.length > 0) {
      const products = await this.productRepository.find({
        where: { id: In(productIds) },
      });
      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products not found');
      }
      promotion.products = products;
    }

    // Asociar categorías si existen
    if (categoryIds && categoryIds.length > 0) {
      const categories = await this.categoryRepository.find({
        where: { id: In(categoryIds) },
      });
      if (categories.length !== categoryIds.length) {
        throw new NotFoundException('One or more categories not found');
      }
      promotion.categories = categories;
    }

    const savedPromotion = await this.promotionRepository.save(promotion);

    void this.notificationsService.sendBroadcast({
      title: '¡Nueva oferta en Mila Raffo!',
      body: savedPromotion.name,
      data: { type: 'offer' },
    });

    return this.findOne(savedPromotion.id);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.promotionRepository.findAndCount({
      skip: offset,
      take: limit,
      order: { priority: 'DESC', createdAt: 'DESC' },
      relations: ['products', 'categories'],
    });

    return {
      data: data.map((promotion) => this.mapPromotion(promotion)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findActive(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;
    const now = new Date();

    const [data, total] = await this.promotionRepository.findAndCount({
      where: {
        status: PromotionStatus.ACTIVE,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      take: limit,
      skip: offset,
      order: { priority: 'DESC' },
      relations: ['products', 'categories'],
    });

    return {
      data: data.map((promotion) => this.mapPromotion(promotion)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(id: UUID): Promise<Record<string, unknown>> {
    const promotion = await this.findOneEntity(id);
    return this.mapPromotion(promotion);
  }

  private async findOneEntity(id: UUID): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
      relations: ['products', 'categories'],
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }

    return promotion;
  }

  async update(
    id: UUID,
    updatePromotionDto: UpdatePromotionDto,
  ): Promise<Record<string, unknown>> {
    const promotion = await this.findOneEntity(id);
    const { productIds, categoryIds, startDate, endDate, ...promotionData } =
      updatePromotionDto;

    // Validar fechas si se actualizan
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Actualizar productos si se especifican
    if (productIds !== undefined) {
      if (productIds.length > 0) {
        const products = await this.productRepository.find({
          where: { id: In(productIds) },
        });
        if (products.length !== productIds.length) {
          throw new NotFoundException('One or more products not found');
        }
        promotion.products = products;
      } else {
        promotion.products = [];
      }
    }

    // Actualizar categorías si se especifican
    if (categoryIds !== undefined) {
      if (categoryIds.length > 0) {
        const categories = await this.categoryRepository.find({
          where: { id: In(categoryIds) },
        });
        if (categories.length !== categoryIds.length) {
          throw new NotFoundException('One or more categories not found');
        }
        promotion.categories = categories;
      } else {
        promotion.categories = [];
      }
    }

    Object.assign(promotion, promotionData);
    if (startDate) promotion.startDate = startDate;
    if (endDate) promotion.endDate = endDate;

    await this.promotionRepository.save(promotion);
    return this.findOne(id);
  }

  async remove(id: UUID): Promise<void> {
    const promotion = await this.findOneEntity(id);
    await this.promotionRepository.softRemove(promotion);
  }

  async updateStatus(): Promise<void> {
    const now = new Date();

    // Activar promociones programadas
    await this.promotionRepository
      .createQueryBuilder()
      .update()
      .set({ status: PromotionStatus.ACTIVE })
      .where('status = :status', { status: PromotionStatus.SCHEDULED })
      .andWhere('start_date <= :now', { now })
      .andWhere('end_date >= :now', { now })
      .execute();

    // Expirar promociones activas
    await this.promotionRepository
      .createQueryBuilder()
      .update()
      .set({ status: PromotionStatus.EXPIRED })
      .where('status = :status', { status: PromotionStatus.ACTIVE })
      .andWhere('end_date < :now', { now })
      .execute();
  }

  async getApplicablePromotions(
    productId: UUID,
    categoryIds: UUID[],
  ): Promise<Promotion[]> {
    const now = new Date();

    const promotions = await this.promotionRepository
      .createQueryBuilder('promotion')
      .leftJoinAndSelect('promotion.products', 'product')
      .leftJoinAndSelect('promotion.categories', 'category')
      .where('promotion.status = :status', { status: PromotionStatus.ACTIVE })
      .andWhere('promotion.start_date <= :now', { now })
      .andWhere('promotion.end_date >= :now', { now })
      .andWhere(
        '(product.id = :productId OR category.id IN (:...categoryIds))',
        {
          productId,
          categoryIds: categoryIds.length > 0 ? categoryIds : [null],
        },
      )
      .orderBy('promotion.priority', 'DESC')
      .getMany();

    return promotions;
  }

  private mapPromotion(promotion: Promotion): Record<string, unknown> {
    return {
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      discountValue: promotion.discountValue,
      buyQuantity: promotion.buyQuantity,
      getQuantity: promotion.getQuantity,
      minimumPurchase: promotion.minimumPurchase,
      maximumDiscount: promotion.maximumDiscount,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      status: promotion.status,
      isStackable: promotion.isStackable,
      priority: promotion.priority,
      products: (promotion.products ?? []).map((product) => ({
        id: product.id,
        name: product.name,
      })),
      categories: (promotion.categories ?? []).map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      })),
    };
  }
}
