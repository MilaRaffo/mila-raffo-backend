import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
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
      isCustomizable: createProductDto.isCustomizable ?? false,
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
    const {
      limit = 10,
      offset = 0,
      sortBy,
      sortOrder,
      name,
      q,
      categoryId,
      available,
      minBasePrice,
      maxBasePrice,
      colorIds,
    } = paginationDto;

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productCategories', 'productCategory')
      .leftJoinAndSelect('productCategory.category', 'category')
      .leftJoinAndSelect('product.productCharacteristics', 'productCharacteristic')
      .leftJoinAndSelect('productCharacteristic.characteristic', 'characteristic')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('variant.images', 'variantImage')
      .leftJoinAndSelect('variant.color', 'variantColor')
      .distinct(true)
      .take(limit)
      .skip(offset);

    if (name) {
      qb.andWhere('LOWER(product.name) LIKE :name', {
        name: `%${name.toLowerCase()}%`,
      });
    }

    if (q) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('LOWER(product.name) LIKE :q', { q: `%${q.toLowerCase()}%` })
            .orWhere('LOWER(product.description) LIKE :q', {
              q: `%${q.toLowerCase()}%`,
            });
        }),
      );
    }

    if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }

    if (available === 'true' || available === 'false') {
      qb.andWhere('product.available = :available', {
        available: available === 'true',
      });
    }

    if (typeof minBasePrice === 'number' && !Number.isNaN(minBasePrice)) {
      qb.andWhere('product.basePrice >= :minBasePrice', { minBasePrice });
    }

    if (typeof maxBasePrice === 'number' && !Number.isNaN(maxBasePrice)) {
      qb.andWhere('product.basePrice <= :maxBasePrice', { maxBasePrice });
    }

    if (colorIds?.length) {
      qb.andWhere('variantColor.id IN (:...colorIds)', { colorIds });
    }

    const sortableFields: Record<string, string> = {
      name: 'product.name',
      basePrice: 'product.basePrice',
      available: 'product.available',
      createdAt: 'product.createdAt',
      updatedAt: 'product.updatedAt',
    };
    const resolvedSortField = sortableFields[sortBy ?? ''] ?? 'product.createdAt';
    const resolvedSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(resolvedSortField, resolvedSortOrder);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((product) => this.mapProduct(product)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findProductsWithVariants(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('variant.images', 'image')
      .leftJoinAndSelect('variant.color', 'color')
      .where('variant.id IS NOT NULL')
      .distinct(true)
      .take(limit)
      .skip(offset);

    const [data, total] = await qb.getManyAndCount();

    // Filter products that actually have variants
    const productsWithVariants = data.filter((p) => (p.variants ?? []).length > 0);

    return {
      data: productsWithVariants.map((product) => ({
        id: product.id,
        name: product.name,
        basePrice: product.basePrice,
        variants: (product.variants ?? []).map((variant) => {
          const firstImage = (variant.images ?? []).length > 0 ? variant.images[0] : null;
          return {
            id: variant.id,
            sku: variant.sku,
            stock: variant.stock,
            image: firstImage
              ? {
                  url: firstImage.url,
                  alt: firstImage.alt,
                }
              : null,
            color: variant.color
              ? {
                  id: variant.color.id,
                  name: variant.color.name,
                  code: variant.color.code,
                  hex: variant.color.hex,
                }
              : null,
          };
        }),
      })),
      pagination: {
        total: productsWithVariants.length,
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
        'variants.images',
        'variants.color',
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
      isCustomizable: updateProductDto.isCustomizable ?? product.isCustomizable,
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
    const firstVariantWithImage = (product.variants ?? []).find(
      (variant) => (variant.images ?? []).length > 0,
    );
    const primaryImage = firstVariantWithImage?.images?.[0];

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      available: product.available,
      isCustomizable: product.isCustomizable,
      image: primaryImage
        ? {
            url: primaryImage.url,
            alt: primaryImage.alt,
          }
        : null,
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
        stock: variant.stock,
        isAvailable: variant.isAvailable,
        color: variant.color
          ? {
              id: variant.color.id,
              name: variant.color.name,
              hex: variant.color.hex,
            }
          : null,
        image: (variant.images ?? []).length
          ? {
              id: variant.images[0].id,
              url: variant.images[0].url,
              alt: variant.images[0].alt,
            }
          : null,
        images: (variant.images ?? []).map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
        })),
      })),
    };
  }

  private async addCategoriesToProduct(
    productId: UUID,
    categoryIds: UUID[],
  ): Promise<void> {
    const normalizedCategoryIds = await this.expandCategoryIdsWithParents(
      categoryIds,
    );

    for (const categoryId of normalizedCategoryIds) {
      const productCategory = this.productCategoriesRepository.create({
        productId,
        categoryId,
      });

      const existingRelation = await this.productCategoriesRepository.findOne({
        where: { productId, categoryId },
      });

      if (!existingRelation) {
        await this.productCategoriesRepository.save(productCategory);
      }
    }
  }

  private async expandCategoryIdsWithParents(
    categoryIds: UUID[],
  ): Promise<UUID[]> {
    const resolvedIds = new Set<string>();

    for (const categoryId of categoryIds) {
      let currentCategoryId: string | undefined = String(categoryId);

      while (currentCategoryId) {
        if (resolvedIds.has(currentCategoryId)) {
          break;
        }

        const category = (await this.categoriesService.findOne(
          currentCategoryId as UUID,
        )) as {
          id: string;
          parent?: { id?: string } | null;
        };

        resolvedIds.add(String(category.id));
        currentCategoryId = category.parent?.id;
      }
    }

    return Array.from(resolvedIds) as UUID[];
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
