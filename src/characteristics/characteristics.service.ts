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
  ): Promise<Record<string, unknown>> {

    const characteristic = this.characteristicsRepository.create(
      createCharacteristicDto,
    );
    const savedCharacteristic = await this.characteristicsRepository.save(
      characteristic,
    );
    return this.mapCharacteristic(savedCharacteristic);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.characteristicsRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { name: 'ASC' },
    });

    return {
      data: data.map((characteristic) => this.mapCharacteristic(characteristic)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(id: UUID): Promise<Record<string, unknown>> {
    const characteristic = await this.characteristicsRepository.findOne({
      where: { id }
    });

    if (!characteristic) {
      throw new NotFoundException(`Characteristic with ID ${id} not found`);
    }

    return this.mapCharacteristic(characteristic);
  }

  async update(
    id: UUID,
    updateCharacteristicDto: UpdateCharacteristicDto,
  ): Promise<Record<string, unknown>> {
    const characteristic = await this.characteristicsRepository.findOne({
      where: { id },
    });

    if (!characteristic) {
      throw new NotFoundException(`Characteristic with ID ${id} not found`);
    }

    Object.assign(characteristic, updateCharacteristicDto);
    const updatedCharacteristic = await this.characteristicsRepository.save(
      characteristic,
    );
    return this.mapCharacteristic(updatedCharacteristic);
  }

  async remove(id: UUID): Promise<void> {
    const characteristic = await this.characteristicsRepository.findOne({
      where: { id },
    });

    if (!characteristic) {
      throw new NotFoundException(`Characteristic with ID ${id} not found`);
    }

    await this.characteristicsRepository.softRemove(characteristic);
  }

  private mapCharacteristic(
    characteristic: Characteristic,
  ): Record<string, unknown> {
    return {
      id: characteristic.id,
      name: characteristic.name,
      dataType: characteristic.dataType,
      units: characteristic.units,
    };
  }
}
