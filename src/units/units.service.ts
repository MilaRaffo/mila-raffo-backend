import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit)
    private readonly unitsRepository: Repository<Unit>,
  ) {}

  async create(createUnitDto: CreateUnitDto): Promise<Unit> {
    const unit = this.unitsRepository.create(createUnitDto);
    return this.unitsRepository.save(unit);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Unit>> {
    const { limit, offset } = paginationDto;

    const [data, total] = await this.unitsRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { name: 'ASC' },
    });

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: number): Promise<Unit> {
    const unit = await this.unitsRepository.findOne({ where: { id } });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }

    return unit;
  }

  async update(id: number, updateUnitDto: UpdateUnitDto): Promise<Unit> {
    const unit = await this.findOne(id);
    Object.assign(unit, updateUnitDto);
    return this.unitsRepository.save(unit);
  }

  async remove(id: number): Promise<void> {
    const unit = await this.findOne(id);
    await this.unitsRepository.softRemove(unit);
  }
}
