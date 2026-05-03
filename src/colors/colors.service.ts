import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Color } from './entities/color.entity';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { ImagesService } from '../images/images.service';
import { type UUID } from 'crypto';

@Injectable()
export class ColorsService {
  constructor(
    @InjectRepository(Color)
    private readonly colorsRepository: Repository<Color>,
  ) {}

  async create(
    createColorDto: CreateColorDto,
  ): Promise<Record<string, unknown>> {
    const existingColor = await this.colorsRepository.findOne({
      where: { code: createColorDto.code },
    });

    if (existingColor) {
      throw new ConflictException('Color code already exists');
    }

    const color = this.colorsRepository.create(createColorDto);
    const savedColor = await this.colorsRepository.save(color);
    return this.findOne(savedColor.id);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.colorsRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { name: 'ASC' },
    });

    return {
      data: data.map((color) => this.mapColor(color)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(id: UUID): Promise<Record<string, unknown>> {
    const color = await this.findOneEntity(id);
    return this.mapColor(color);
  }

  private async findOneEntity(id: UUID): Promise<Color> {
    const color = await this.colorsRepository.findOne({
      where: { id },
    });

    if (!color) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }

    return color;
  }

  async update(
    id: UUID,
    updateColorDto: UpdateColorDto,
  ): Promise<Record<string, unknown>> {
    const color = await this.findOneEntity(id);

    if (updateColorDto.code && updateColorDto.code !== color.code) {
      const existingColor = await this.colorsRepository.findOne({
        where: { code: updateColorDto.code },
      });

      if (existingColor) {
        throw new ConflictException('Color code already exists');
      }
    }

    Object.assign(color, updateColorDto);
    await this.colorsRepository.save(color);
    return this.findOne(id);
  }

  async remove(id: UUID): Promise<void> {
    const color = await this.findOneEntity(id);
    await this.colorsRepository.softRemove(color);
  }

  private mapColor(color: Color): Record<string, unknown> {
    return {
      id: color.id,
      name: color.name,
      code: color.code,
      hex: color.hex,
      isActive: color.isActive,
    };
  }
}
