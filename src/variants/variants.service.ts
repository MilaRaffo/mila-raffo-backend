import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Variant } from './entities/variant.entity';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { ProductsService } from '../products/products.service';
import { ColorsService } from '../colors/colors.service';
import { type UUID } from 'crypto';

@Injectable()
export class VariantsService {
  constructor(
    @InjectRepository(Variant)
    private readonly variantsRepository: Repository<Variant>,
    private readonly productsService: ProductsService,
    private readonly colorsService: ColorsService,
  ) {}

  async create(
    createVariantDto: CreateVariantDto,
  ): Promise<Record<string, unknown>> {
    const existingVariant = await this.variantsRepository.findOne({
      where: { sku: createVariantDto.sku },
    });

    if (existingVariant) {
      throw new ConflictException('SKU already exists');
    }

    await this.productsService.findOne(createVariantDto.productId);

    if (createVariantDto.colorId) {
      await this.colorsService.findOne(createVariantDto.colorId);
    }

    const variant = this.variantsRepository.create({
      productId: createVariantDto.productId,
      sku: createVariantDto.sku,
      price: createVariantDto.price,
      stock: createVariantDto.stock ?? 0,
      isAvailable: createVariantDto.isAvailable ?? true,
      colorId: createVariantDto.colorId ?? null,
    });

    const savedVariant = await this.variantsRepository.save(variant);
    return this.findOne(savedVariant.id);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.variantsRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: ['product', 'images', 'color'],
      order: { createdAt: 'DESC' },
    });

    return {
      data: data.map((variant) => this.mapVariant(variant)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(id: UUID): Promise<Record<string, unknown>> {
    const variant = await this.findOneEntity(id);
    return this.mapVariant(variant);
  }

  private async findOneEntity(id: UUID): Promise<Variant> {
    const variant = await this.variantsRepository.findOne({
      where: { id },
      relations: ['product', 'images', 'color'],
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }

    return variant;
  }

  async update(
    id: UUID,
    updateVariantDto: UpdateVariantDto,
  ): Promise<Record<string, unknown>> {
    const variant = await this.findOneEntity(id);

    if (updateVariantDto.sku && updateVariantDto.sku !== variant.sku) {
      const existingVariant = await this.variantsRepository.findOne({
        where: { sku: updateVariantDto.sku },
      });

      if (existingVariant) {
        throw new ConflictException('SKU already exists');
      }
    }

    if (updateVariantDto.colorId && updateVariantDto.colorId !== variant.colorId) {
      await this.colorsService.findOne(updateVariantDto.colorId);
    }

    Object.assign(variant, {
      sku: updateVariantDto.sku ?? variant.sku,
      price: updateVariantDto.price ?? variant.price,
      stock: updateVariantDto.stock ?? variant.stock,
      isAvailable: updateVariantDto.isAvailable ?? variant.isAvailable,
      colorId: updateVariantDto.colorId ?? variant.colorId,
    });

    await this.variantsRepository.save(variant);
    return this.findOne(id);
  }

  async remove(id: UUID): Promise<void> {
    const variant = await this.findOneEntity(id);
    await this.variantsRepository.softRemove(variant);
  }

  async updateStock(id: UUID, quantity: number): Promise<void> {
    const variant = await this.findOneEntity(id);
    variant.stock = Math.max(0, variant.stock + quantity);
    await this.variantsRepository.save(variant);
  }

  private mapVariant(variant: Variant): Record<string, unknown> {
    return {
      id: variant.id,
      sku: variant.sku,
      price: variant.price,
      stock: variant.stock,
      isAvailable: variant.isAvailable,
      product: variant.product
        ? {
            id: variant.product.id,
            name: variant.product.name,
          }
        : null,
      images: (variant.images ?? []).map((image) => ({
        url: image.url,
        alt: image.alt,
      })),
      color: variant.color
        ? {
            id: variant.color.id,
            name: variant.color.name,
            code: variant.color.code,
            hex: variant.color.hex,
            isActive: variant.color.isActive,
          }
        : null,
    };
  }
}

