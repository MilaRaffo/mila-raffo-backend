import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leather } from './entities/leather.entity';
import { CreateLeatherDto } from './dto/create-leather.dto';
import { UpdateLeatherDto } from './dto/update-leather.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { ImagesService } from '../images/images.service';
import { type UUID } from 'crypto';

@Injectable()
export class LeathersService {
  constructor(
    @InjectRepository(Leather)
    private readonly leathersRepository: Repository<Leather>,
    private readonly imagesService: ImagesService,
  ) {}

  async create(
    createLeatherDto: CreateLeatherDto,
  ): Promise<Record<string, unknown>> {
    const existingLeather = await this.leathersRepository.findOne({
      where: { code: createLeatherDto.code },
    });

    if (existingLeather) {
      throw new ConflictException('Leather code already exists');
    }

    if (createLeatherDto.imageId) {
      await this.imagesService.findOne(createLeatherDto.imageId);
    }

    const leather = this.leathersRepository.create(createLeatherDto);
    const savedLeather = await this.leathersRepository.save(leather);
    return this.findOne(savedLeather.id);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.leathersRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: ['image'],
      order: { name: 'ASC' },
    });

    return {
      data: data.map((leather) => this.mapLeather(leather)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(id: UUID): Promise<Record<string, unknown>> {
    const leather = await this.findOneEntity(id);
    return this.mapLeather(leather);
  }

  private async findOneEntity(id: UUID): Promise<Leather> {
    const leather = await this.leathersRepository.findOne({
      where: { id },
      relations: ['image'],
    });

    if (!leather) {
      throw new NotFoundException(`Leather with ID ${id} not found`);
    }

    return leather;
  }

  async update(
    id: UUID,
    updateLeatherDto: UpdateLeatherDto,
  ): Promise<Record<string, unknown>> {
    const leather = await this.findOneEntity(id);

    if (updateLeatherDto.code && updateLeatherDto.code !== leather.code) {
      const existingLeather = await this.leathersRepository.findOne({
        where: { code: updateLeatherDto.code },
      });

      if (existingLeather) {
        throw new ConflictException('Leather code already exists');
      }
    }

    if (updateLeatherDto.imageId) {
      await this.imagesService.findOne(updateLeatherDto.imageId);
    }

    Object.assign(leather, updateLeatherDto);
    await this.leathersRepository.save(leather);
    return this.findOne(id);
  }

  async remove(id: UUID): Promise<void> {
    const leather = await this.findOneEntity(id);
    await this.leathersRepository.softRemove(leather);
  }

  private mapLeather(leather: Leather): Record<string, unknown> {
    return {
      id: leather.id,
      name: leather.name,
      code: leather.code,
      color: leather.color,
      isActive: leather.isActive,
      imageId: leather.image?.id ?? null,
      image: leather.image
        ? {
            url: leather.image.url,
            alt: leather.image.alt,
          }
        : null,
    };
  }
}
