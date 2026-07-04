import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { type UUID } from 'crypto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Record<string, unknown>> {
    const existingCategory = await this.categoriesRepository.findOne({
      where: { slug: createCategoryDto.slug },
    });

    if (existingCategory) {
      throw new ConflictException('Slug already exists');
    }

    if (createCategoryDto.parentId) {
      const parent = await this.findOneEntity(createCategoryDto.parentId);
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const category = this.categoriesRepository.create(createCategoryDto);
    const savedCategory = await this.categoriesRepository.save(category);
    return this.findOne(savedCategory.id);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.categoriesRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: ['parent', 'children'],
      order: { name: 'ASC' },
    });

    return {
      data: data.map((category) => this.mapCategory(category)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(id: UUID): Promise<Record<string, unknown>> {
    const category = await this.findOneEntity(id);
    return this.mapCategory(category);
  }

  private async findOneEntity(id: UUID): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findTree(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const categories = await this.categoriesRepository.find({
      where: { parentId: IsNull() },
      relations: ['children'],
      order: { name: 'ASC' },
    });

    const fullTree = await this.buildCategoryTree(categories);
    const pagedTree = fullTree.slice(offset, offset + limit);

    const toTreeNode = (category: Category): Record<string, unknown> => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      active: category.active,
      children: (category.children ?? []).map(toTreeNode),
    });

    return {
      data: pagedTree.map(toTreeNode),
      pagination: {
        total: fullTree.length,
        limit,
        offset,
      },
    };
  }

  private async buildCategoryTree(categories: Category[]): Promise<Category[]> {
    for (const category of categories) {
      if (category.children && category.children.length > 0) {
        category.children = await this.buildCategoryTree(category.children);
      }
    }
    return categories;
  }

  async findCategoryProducts(
    id: UUID,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['productCategories', 'productCategories.product'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const products = (category.productCategories ?? [])
      .map((productCategory) => productCategory.product)
      .filter((product) => !!product);

    const pagedProducts = products.slice(offset, offset + limit);

    return {
      data: pagedProducts.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        available: product.available,
      })),
      pagination: {
        total: products.length,
        limit,
        offset,
      },
    };
  }

  async update(
    id: UUID,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Record<string, unknown>> {
    const category = await this.findOneEntity(id);

    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingCategory = await this.categoriesRepository.findOne({
        where: { slug: updateCategoryDto.slug },
      });

      if (existingCategory) {
        throw new ConflictException('Slug already exists');
      }
    }

    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      await this.findOneEntity(updateCategoryDto.parentId);
    }

    Object.assign(category, updateCategoryDto);
    await this.categoriesRepository.save(category);
    return this.findOne(id);
  }

  async remove(id: UUID): Promise<void> {
    const category = await this.findOneEntity(id);

    if (category.children && category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories',
      );
    }

    await this.categoriesRepository.softRemove(category);
  }

  private mapCategory(category: Category): Record<string, unknown> {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      active: category.active,
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.name,
            slug: category.parent.slug,
          }
        : null,
      children: (category.children ?? []).map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description,
        active: child.active,
      })),
    };
  }
}
