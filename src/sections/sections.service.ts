import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Section } from './entities/section.entity';
import { SectionItem } from './entities/section-item.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateSectionItemDto } from './dto/create-section-item.dto';
import { UpdateSectionItemDto } from './dto/update-section-item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { type UUID } from 'crypto';

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionsRepository: Repository<Section>,
    @InjectRepository(SectionItem)
    private readonly sectionItemsRepository: Repository<SectionItem>,
  ) {}

  // SECTION CRUD
  async createSection(createSectionDto: CreateSectionDto): Promise<Section> {
    const existingSection = await this.sectionsRepository.findOne({
      where: { slug: createSectionDto.slug },
    });

    if (existingSection) {
      throw new ConflictException('Section slug already exists');
    }

    const section = this.sectionsRepository.create(createSectionDto);
    return this.sectionsRepository.save(section);
  }

  async findAllSections(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Section>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.sectionsRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: ['items'],
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    return {
      data,
      pagination: { total, limit, offset },
    };
  }

  async findAllSectionsActive(): Promise<Section[]> {
    return this.sectionsRepository.find({
      where: { isActive: true },
      relations: ['items'],
      order: {
        order: 'ASC',
        items: { order: 'ASC' },
      },
    });
  }

  async findSectionById(id: UUID): Promise<Section> {
    const section = await this.sectionsRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    return section;
  }

  async findSectionBySlug(slug: string): Promise<Section> {
    const section = await this.sectionsRepository.findOne({
      where: { slug },
      relations: ['items'],
    });

    if (!section) {
      throw new NotFoundException(`Section with slug ${slug} not found`);
    }

    return section;
  }

  async updateSection(
    id: UUID,
    updateSectionDto: UpdateSectionDto,
  ): Promise<Section> {
    const section = await this.findSectionById(id);

    if (updateSectionDto.slug && updateSectionDto.slug !== section.slug) {
      const existingSection = await this.sectionsRepository.findOne({
        where: { slug: updateSectionDto.slug },
      });

      if (existingSection) {
        throw new ConflictException('Section slug already exists');
      }
    }

    Object.assign(section, updateSectionDto);
    return this.sectionsRepository.save(section);
  }

  async removeSection(id: UUID): Promise<void> {
    const section = await this.findSectionById(id);
    await this.sectionsRepository.remove(section);
  }

  // SECTION ITEM CRUD
  async createSectionItem(
    createSectionItemDto: CreateSectionItemDto,
  ): Promise<SectionItem> {
    // Verify section exists
    await this.findSectionById(createSectionItemDto.sectionId);

    const item = this.sectionItemsRepository.create(createSectionItemDto);
    return this.sectionItemsRepository.save(item);
  }

  async findAllSectionItems(
    sectionId: UUID,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<SectionItem>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.sectionItemsRepository.findAndCount({
      where: { sectionId },
      take: limit,
      skip: offset,
      relations: ['image'],
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    return {
      data,
      pagination: { total, limit, offset },
    };
  }

  async findSectionItemById(id: UUID): Promise<SectionItem> {
    const item = await this.sectionItemsRepository.findOne({
      where: { id },
      relations: ['image'],
    });

    if (!item) {
      throw new NotFoundException(`Section item with ID ${id} not found`);
    }

    return item;
  }

  async updateSectionItem(
    id: UUID,
    updateSectionItemDto: UpdateSectionItemDto,
  ): Promise<SectionItem> {
    const item = await this.findSectionItemById(id);

    if (
      updateSectionItemDto.sectionId &&
      updateSectionItemDto.sectionId !== item.sectionId
    ) {
      await this.findSectionById(updateSectionItemDto.sectionId);
    }

    Object.assign(item, updateSectionItemDto);
    return this.sectionItemsRepository.save(item);
  }

  async removeSectionItem(id: UUID): Promise<void> {
    const item = await this.findSectionItemById(id);
    await this.sectionItemsRepository.remove(item);
  }

  // REORDER operations
  async reorderSections(sectionIds: UUID[]): Promise<Section[]> {
    const sections = await this.sectionsRepository.findBy({
      id: In(sectionIds),
    });

    sections.forEach((section, index) => {
      section.order = index;
    });

    return this.sectionsRepository.save(sections);
  }

  async reorderSectionItems(itemIds: UUID[]): Promise<SectionItem[]> {
    const items = await this.sectionItemsRepository.findBy({
      id: In(itemIds),
    });

    items.forEach((item, index) => {
      item.order = index;
    });

    return this.sectionItemsRepository.save(items);
  }
}
