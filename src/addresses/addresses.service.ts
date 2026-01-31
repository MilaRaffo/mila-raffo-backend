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

    const address = this.addressRepository.create({
      ...createAddressDto,
      userId,
    });

    return await this.addressRepository.save(address);
  }

  async findAllByUser(userId: UUID): Promise<Address[]> {
    return await this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: UUID, userId: UUID): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    // Verificar que la dirección pertenece al usuario
    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have access to this address');
    }

    return address;
  }

  async findDefault(userId: UUID): Promise<Address | null> {
    return await this.addressRepository.findOne({
      where: { userId, isDefault: true },
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

    Object.assign(address, updateAddressDto);
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

  private async unsetDefaultAddresses(userId: UUID): Promise<void> {
    await this.addressRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
  }
}
