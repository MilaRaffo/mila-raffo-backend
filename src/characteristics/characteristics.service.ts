import {
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Characteristic } from './entities/characteristic.entity';
import { CreateCharacteristicDto } from './dto/create-characteristic.dto';
import { UpdateCharacteristicDto } from './dto/update-characteristic.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { type UUID } from 'crypto';

@Injectable()
export class CharacteristicsService {
  constructor(
    @InjectRepository(Characteristic)
    private readonly characteristicsRepository: Repository<Characteristic>,
  ) {}

  async create(
    createCharacteristicDto: CreateCharacteristicDto,
  ): Promise<Characteristic> {

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
      order: { name: 'ASC' },
    });

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: UUID): Promise<Characteristic> {
    const characteristic = await this.characteristicsRepository.findOne({
      where: { id }
    });

    if (!characteristic) {
      throw new NotFoundException(`Characteristic with ID ${id} not found`);
    }

    return characteristic;
  }

  async update(
    id: UUID,
    updateCharacteristicDto: UpdateCharacteristicDto,
  ): Promise<Characteristic> {
    const characteristic = await this.findOne(id);

    Object.assign(characteristic, updateCharacteristicDto);
    return this.characteristicsRepository.save(characteristic);
  }

  async remove(id: UUID): Promise<void> {
    const characteristic = await this.findOne(id);
    await this.characteristicsRepository.softRemove(characteristic);
  }
}
