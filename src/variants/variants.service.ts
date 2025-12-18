import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Variant } from './entities/variant.entity';
import { VariantLeather } from './entities/variant-leather.entity';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { ProductsService } from '../products/products.service';
import { LeathersService } from '../leathers/leathers.service';

@Injectable()
export class VariantsService {
  constructor(
    @InjectRepository(Variant)
    private readonly variantsRepository: Repository<Variant>,
    @InjectRepository(VariantLeather)
    private readonly variantLeathersRepository: Repository<VariantLeather>,
    private readonly productsService: ProductsService,
    private readonly leathersService: LeathersService,
  ) {}

  async create(createVariantDto: CreateVariantDto): Promise<Variant> {
    const existingVariant = await this.variantsRepository.findOne({
      where: { sku: createVariantDto.sku },
    });

    if (existingVariant) {
      throw new ConflictException('SKU already exists');
    }

    await this.productsService.findOne(createVariantDto.productId);

    const variant = this.variantsRepository.create({
      productId: createVariantDto.productId,
      sku: createVariantDto.sku,
      price: createVariantDto.price,
    });

    const savedVariant = await this.variantsRepository.save(variant);

    if (createVariantDto.leatherIds && createVariantDto.leatherIds.length > 0) {
      await this.addLeathersToVariant(
        savedVariant.id,
        createVariantDto.leatherIds,
      );
    }

    return this.findOne(savedVariant.id);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Variant>> {
    const { limit, offset } = paginationDto;

    const [data, total] = await this.variantsRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: [
        'product',
        'images',
        'variantLeathers',
        'variantLeathers.leather',
        'variantLeathers.leather.image',
      ],
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: number): Promise<Variant> {
    const variant = await this.variantsRepository.findOne({
      where: { id },
      relations: [
        'product',
        'images',
        'variantLeathers',
        'variantLeathers.leather',
        'variantLeathers.leather.image',
      ],
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }

    return variant;
  }

  async addLeathersToVariant(
    variantId: number,
    leatherIds: number[],
  ): Promise<Variant> {
    const variant = await this.findOne(variantId);

    for (const leatherId of leatherIds) {
      await this.leathersService.findOne(leatherId);

      const existingVariantLeather = await this.variantLeathersRepository.findOne({
        where: { variantId, leatherId },
      });

      if (!existingVariantLeather) {
        const variantLeather = this.variantLeathersRepository.create({
          variantId,
          leatherId,
        });
        await this.variantLeathersRepository.save(variantLeather);
      }
    }

    return this.findOne(variantId);
  }

  async removeLeatherFromVariant(
    variantId: number,
    leatherId: number,
  ): Promise<void> {
    await this.findOne(variantId);
    await this.leathersService.findOne(leatherId);

    await this.variantLeathersRepository.delete({ variantId, leatherId });
  }

  async update(
    id: number,
    updateVariantDto: UpdateVariantDto,
  ): Promise<Variant> {
    const variant = await this.findOne(id);

    if (updateVariantDto.sku && updateVariantDto.sku !== variant.sku) {
      const existingVariant = await this.variantsRepository.findOne({
        where: { sku: updateVariantDto.sku },
      });

      if (existingVariant) {
        throw new ConflictException('SKU already exists');
      }
    }

    Object.assign(variant, {
      sku: updateVariantDto.sku ?? variant.sku,
      price: updateVariantDto.price ?? variant.price,
    });

    await this.variantsRepository.save(variant);

    if (updateVariantDto.leatherIds) {
      await this.variantLeathersRepository.delete({ variantId: id });
      if (updateVariantDto.leatherIds.length > 0) {
        await this.addLeathersToVariant(id, updateVariantDto.leatherIds);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const variant = await this.findOne(id);
    await this.variantsRepository.softRemove(variant);
  }
}
