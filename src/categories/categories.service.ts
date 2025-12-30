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

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existingCategory = await this.categoriesRepository.findOne({
      where: { slug: createCategoryDto.slug },
    });

    if (existingCategory) {
      throw new ConflictException('Slug already exists');
    }

    if (createCategoryDto.parentId) {
      const parent = await this.findOne(createCategoryDto.parentId);
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Category>> {
    const { limit, offset } = paginationDto;

    const [data, total] = await this.categoriesRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: ['parent', 'children'],
      order: { name: 'ASC' },
    });

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: UUID): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findTree(): Promise<Category[]> {
    const categories = await this.categoriesRepository.find({
      where: { parentId: IsNull() },
      relations: ['children'],
      order: { name: 'ASC' },
    });

    return this.buildCategoryTree(categories);
  }

  private async buildCategoryTree(categories: Category[]): Promise<Category[]> {
    for (const category of categories) {
      if (category.children && category.children.length > 0) {
        category.children = await this.buildCategoryTree(category.children);
      }
    }
    return categories;
  }

  async findCategoryProducts(id: UUID): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['productCategories', 'productCategories.product'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: UUID,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (
      updateCategoryDto.slug &&
      updateCategoryDto.slug !== category.slug
    ) {
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
      await this.findOne(updateCategoryDto.parentId);
    }

    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: UUID): Promise<void> {
    const category = await this.findOne(id);

    if (category.children && category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories',
      );
    }

    await this.categoriesRepository.softRemove(category);
  }
}
