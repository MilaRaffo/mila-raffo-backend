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

  async create(createLeatherDto: CreateLeatherDto): Promise<Leather> {
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
    return this.leathersRepository.save(leather);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Leather>> {
    const { limit, offset } = paginationDto;

    const [data, total] = await this.leathersRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: ['image'],
      order: { name: 'ASC' },
    });

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: UUID): Promise<Leather> {
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
  ): Promise<Leather> {
    const leather = await this.findOne(id);

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
    return this.leathersRepository.save(leather);
  }

  async remove(id: UUID): Promise<void> {
    const leather = await this.findOne(id);
    await this.leathersRepository.softRemove(leather);
  }
}
