import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';
import { type UUID } from 'crypto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(
    createAddressDto: CreateAddressDto,
    userId: UUID,
  ): Promise<Address> {
    // Si esta dirección se marca como predeterminada, desmarcar otras
    if (createAddressDto.isDefault) {
      await this.unsetDefaultAddresses(userId);
    }

    const { latitude, longitude, ...addressData } = createAddressDto;
    const normalizedCoordinates = this.normalizeCoordinates(latitude, longitude);

    const address = this.addressRepository.create({
      ...addressData,
      ...normalizedCoordinates,
      user: { id: userId } as User,
    });

    return await this.addressRepository.save(address);
  }

  async findAllByUser(userId: UUID): Promise<Address[]> {
    return await this.addressRepository.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: UUID, userId: UUID): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return address;
  }

  async findDefault(userId: UUID): Promise<Address | null> {
    return await this.addressRepository.findOne({
      where: { user: { id: userId }, isDefault: true },
    });
  }

  async update(
    id: UUID,
    updateAddressDto: UpdateAddressDto,
    userId: UUID,
  ): Promise<Address> {
    const address = await this.findOne(id, userId);

    // Si se marca como predeterminada, desmarcar otras
    if (updateAddressDto.isDefault) {
      await this.unsetDefaultAddresses(userId);
    }

    const { latitude, longitude, ...addressData } = updateAddressDto;
    const normalizedCoordinates = this.normalizeCoordinates(latitude, longitude);
    Object.assign(address, addressData, normalizedCoordinates);
    return await this.addressRepository.save(address);
  }

  async setAsDefault(id: UUID, userId: UUID): Promise<Address> {
    const address = await this.findOne(id, userId);

    await this.unsetDefaultAddresses(userId);

    address.isDefault = true;
    return await this.addressRepository.save(address);
  }

  async remove(id: UUID, userId: UUID): Promise<void> {
    const address = await this.findOne(id, userId);
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
}


