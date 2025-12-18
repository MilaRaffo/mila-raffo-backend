import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Characteristic } from './entities/characteristic.entity';
import { CreateCharacteristicDto } from './dto/create-characteristic.dto';
import { UpdateCharacteristicDto } from './dto/update-characteristic.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { UnitsService } from '../units/units.service';

@Injectable()
export class CharacteristicsService {
  constructor(
    @InjectRepository(Characteristic)
    private readonly characteristicsRepository: Repository<Characteristic>,
    private readonly unitsService: UnitsService,
  ) {}

  async create(
    createCharacteristicDto: CreateCharacteristicDto,
  ): Promise<Characteristic> {
    if (createCharacteristicDto.unitId) {
      await this.unitsService.findOne(createCharacteristicDto.unitId);
    }

    const characteristic = this.characteristicsRepository.create(
      createCharacteristicDto,
    );
    return this.characteristicsRepository.save(characteristic);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Characteristic>> {
    const { limit, offset } = paginationDto;

    const [data, total] = await this.characteristicsRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: ['unit'],
      order: { name: 'ASC' },
    });

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: number): Promise<Characteristic> {
    const characteristic = await this.characteristicsRepository.findOne({
      where: { id },
      relations: ['unit'],
    });

    if (!characteristic) {
      throw new NotFoundException(`Characteristic with ID ${id} not found`);
    }

    return characteristic;
  }

  async update(
    id: number,
    updateCharacteristicDto: UpdateCharacteristicDto,
  ): Promise<Characteristic> {
    const characteristic = await this.findOne(id);

    if (updateCharacteristicDto.unitId) {
      await this.unitsService.findOne(updateCharacteristicDto.unitId);
    }

    Object.assign(characteristic, updateCharacteristicDto);
    return this.characteristicsRepository.save(characteristic);
  }

  async remove(id: number): Promise<void> {
    const characteristic = await this.findOne(id);
    await this.characteristicsRepository.softRemove(characteristic);
  }
}
