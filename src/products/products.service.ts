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

  async create(createProductDto: CreateProductDto): Promise<Product> {
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
  ): Promise<PaginatedResult<Product>> {
    const { limit, offset } = paginationDto;

    const [data, total] = await this.productsRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: [
        'productCategories',
        'productCategories.category',
        'productCharacteristics',
        'productCharacteristics.characteristic',
        'productCharacteristics.characteristic.unit',
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

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: [
        'productCategories',
        'productCategories.category',
        'productCharacteristics',
        'productCharacteristics.characteristic',
        'productCharacteristics.characteristic.unit',
        'variants',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findProductVariants(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['variants', 'variants.images'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findProductCharacteristics(id: number): Promise<ProductCharacteristic[]> {
    const product = await this.findOne(id);
    return this.productCharacteristicsRepository.find({
      where: { productId: product.id },
      relations: ['characteristic', 'characteristic.unit'],
    });
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

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

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.softRemove(product);
  }

  private async addCategoriesToProduct(
    productId: number,
    categoryIds: number[],
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
    productId: number,
    characteristics: Array<{ characteristicId: number; value: string }>,
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
