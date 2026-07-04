import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';
import { type UUID } from 'crypto';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(
    createAddressDto: CreateAddressDto,
    userId: UUID,
  ): Promise<Record<string, unknown>> {
    // Si esta dirección se marca como predeterminada, desmarcar otras
    if (createAddressDto.isDefault) {
      await this.unsetDefaultAddresses(userId);
    }

    const { latitude, longitude, ...addressData } = createAddressDto;
    const normalizedCoordinates = this.normalizeCoordinates(
      latitude,
      longitude,
    );

    const address = this.addressRepository.create({
      ...addressData,
      ...normalizedCoordinates,
      user: { id: userId } as User,
    });

    const savedAddress = await this.addressRepository.save(address);
    return this.findOne(savedAddress.id, userId);
  }

  async findAllByUser(
    userId: UUID,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.addressRepository.findAndCount({
      where: { user: { id: userId } },
      take: limit,
      skip: offset,
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });

    return {
      data: data.map((address) => this.mapAddress(address)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(id: UUID, userId: UUID): Promise<Record<string, unknown>> {
    const address = await this.findOneEntity(id, userId);
    return this.mapAddress(address);
  }

  private async findOneEntity(id: UUID, userId: UUID): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return address;
  }

  async findDefault(userId: UUID): Promise<Record<string, unknown> | null> {
    const address = await this.addressRepository.findOne({
      where: { user: { id: userId }, isDefault: true },
    });

    return address ? this.mapAddress(address) : null;
  }

  async update(
    id: UUID,
    updateAddressDto: UpdateAddressDto,
    userId: UUID,
  ): Promise<Record<string, unknown>> {
    const address = await this.findOneEntity(id, userId);

    // Si se marca como predeterminada, desmarcar otras
    if (updateAddressDto.isDefault) {
      await this.unsetDefaultAddresses(userId);
    }

    const { latitude, longitude, ...addressData } = updateAddressDto;
    const normalizedCoordinates = this.normalizeCoordinates(
      latitude,
      longitude,
    );
    Object.assign(address, addressData, normalizedCoordinates);
    await this.addressRepository.save(address);
    return this.findOne(id, userId);
  }

  async setAsDefault(id: UUID, userId: UUID): Promise<Record<string, unknown>> {
    const address = await this.findOneEntity(id, userId);

    await this.unsetDefaultAddresses(userId);

    address.isDefault = true;
    await this.addressRepository.save(address);
    return this.findOne(id, userId);
  }

  async remove(id: UUID, userId: UUID): Promise<void> {
    const address = await this.findOneEntity(id, userId);
    await this.addressRepository.softRemove(address);
  }

  private normalizeCoordinates(latitude?: number, longitude?: number) {
    const normalized: { latitude?: string; longitude?: string } = {};

    if (latitude !== undefined) {
      normalized.latitude = latitude.toString();
    }

    if (longitude !== undefined) {
      normalized.longitude = longitude.toString();
    }

    return normalized;
  }

  private async unsetDefaultAddresses(userId: UUID): Promise<void> {
    await this.addressRepository.update(
      { user: { id: userId }, isDefault: true },
      { isDefault: false },
    );
  }

  private mapAddress(address: Address): Record<string, unknown> {
    return {
      id: address.id,
      streetAddress: address.streetAddress,
      apartment: address.apartment,
      city: address.city,
      stateProvince: address.stateProvince,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      isDefault: address.isDefault,
      notes: address.notes,
      latitude: address.latitude,
      longitude: address.longitude,
    };
  }
}
