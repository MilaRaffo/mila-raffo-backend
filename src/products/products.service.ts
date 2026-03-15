import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductCharacteristic } from './entities/product-characteristic.entity';
import { ProductCategory } from './entities/product-category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { CategoriesService } from '../categories/categories.service';
import { CharacteristicsService } from '../characteristics/characteristics.service';
import { type UUID } from 'crypto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductCharacteristic)
    private readonly productCharacteristicsRepository: Repository<ProductCharacteristic>,
    @InjectRepository(ProductCategory)
    private readonly productCategoriesRepository: Repository<ProductCategory>,
    private readonly categoriesService: CategoriesService,
    private readonly characteristicsService: CharacteristicsService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
  ): Promise<Record<string, unknown>> {
    const product = this.productsRepository.create({
      name: createProductDto.name,
      description: createProductDto.description,
      basePrice: createProductDto.basePrice,
      available: createProductDto.available ?? true,
    });

    const savedProduct = await this.productsRepository.save(product);

    // Add categories
    if (createProductDto.categoryIds && createProductDto.categoryIds.length > 0) {
      await this.addCategoriesToProduct(
        savedProduct.id,
        createProductDto.categoryIds,
      );
    }

    // Add characteristics
    if (
      createProductDto.characteristics &&
      createProductDto.characteristics.length > 0
    ) {
      await this.addCharacteristicsToProduct(
        savedProduct.id,
        createProductDto.characteristics,
      );
    }

    return this.findOne(savedProduct.id);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.productsRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: [
        'productCategories',
        'productCategories.category',
        'productCharacteristics',
        'productCharacteristics.characteristic',
      ],
      order: { createdAt: 'DESC' },
    });

    return {
      data: data.map((product) => this.mapProduct(product)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(id: UUID): Promise<Record<string, unknown>> {
    const product = await this.findOneEntity(id);
    return this.mapProduct(product);
  }

  private async findOneEntity(id: UUID): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: [
        'productCategories',
        'productCategories.category',
        'productCharacteristics',
        'productCharacteristics.characteristic',
        'variants',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findProductVariants(
    id: UUID,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['variants', 'variants.images'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const variants = product.variants ?? [];
    const pagedVariants = variants.slice(offset, offset + limit);

    return {
      data: pagedVariants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
        isAvailable: variant.isAvailable,
        images: (variant.images ?? []).map((image) => ({
          url: image.url,
          alt: image.alt,
        })),
      })),
      pagination: {
        total: variants.length,
        limit,
        offset,
      },
    };
  }

  async findProductCharacteristics(
    id: UUID,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;
    await this.findOneEntity(id);
    const [data, total] = await this.productCharacteristicsRepository.findAndCount({
      where: { productId: id },
      relations: ['characteristic'],
      take: limit,
      skip: offset,
    });

    return {
      data: data.map((item) => ({
        characteristic: item.characteristic
          ? {
              id: item.characteristic.id,
              name: item.characteristic.name,
              dataType: item.characteristic.dataType,
              units: item.characteristic.units,
            }
          : null,
        value: item.value,
      })),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async update(
    id: UUID,
    updateProductDto: UpdateProductDto,
  ): Promise<Record<string, unknown>> {
    const product = await this.findOneEntity(id);

    Object.assign(product, {
      name: updateProductDto.name ?? product.name,
      description: updateProductDto.description ?? product.description,
      basePrice: updateProductDto.basePrice ?? product.basePrice,
      available: updateProductDto.available ?? product.available,
    });

    await this.productsRepository.save(product);

    // Update categories if provided
    if (updateProductDto.categoryIds) {
      await this.productCategoriesRepository.delete({ productId: id });
      if (updateProductDto.categoryIds.length > 0) {
        await this.addCategoriesToProduct(id, updateProductDto.categoryIds);
      }
    }

    // Update characteristics if provided
    if (updateProductDto.characteristics) {
      await this.productCharacteristicsRepository.delete({ productId: id });
      if (updateProductDto.characteristics.length > 0) {
        await this.addCharacteristicsToProduct(
          id,
          updateProductDto.characteristics,
        );
      }
    }

    return this.findOne(id);
  }

  async remove(id: UUID): Promise<void> {
    const product = await this.findOneEntity(id);
    await this.productsRepository.softRemove(product);
  }

  private mapProduct(product: Product): Record<string, unknown> {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      available: product.available,
      categories: (product.productCategories ?? []).map((productCategory) => ({
        id: productCategory.category?.id,
        name: productCategory.category?.name,
        slug: productCategory.category?.slug,
      })),
      characteristics: (product.productCharacteristics ?? []).map(
        (productCharacteristic) => ({
          id: productCharacteristic.characteristic?.id,
          name: productCharacteristic.characteristic?.name,
          dataType: productCharacteristic.characteristic?.dataType,
          units: productCharacteristic.characteristic?.units,
          value: productCharacteristic.value,
        }),
      ),
      variants: (product.variants ?? []).map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
        isAvailable: variant.isAvailable,
      })),
    };
  }

  private async addCategoriesToProduct(
    productId: UUID,
    categoryIds: UUID[],
  ): Promise<void> {
    for (const categoryId of categoryIds) {
      await this.categoriesService.findOne(categoryId);
      const productCategory = this.productCategoriesRepository.create({
        productId,
        categoryId,
      });
      await this.productCategoriesRepository.save(productCategory);
    }
  }

  private async addCharacteristicsToProduct(
    productId: UUID,
    characteristics: Array<{ characteristicId: UUID; value: string }>,
  ): Promise<void> {
    for (const char of characteristics) {
      await this.characteristicsService.findOne(char.characteristicId);
      const productCharacteristic =
        this.productCharacteristicsRepository.create({
          productId,
          characteristicId: char.characteristicId,
          value: char.value,
        });
      await this.productCharacteristicsRepository.save(productCharacteristic);
    }
  }
}
