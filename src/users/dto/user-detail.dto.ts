import { ApiProperty } from '@nestjs/swagger';
import { type UUID } from 'crypto';
import { User } from '../entities/user.entity';

class AddressDto {
  @ApiProperty()
  id: UUID;

  @ApiProperty()
  streetAddress: string;

  @ApiProperty({ nullable: true })
  apartment?: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  stateProvince: string;

  @ApiProperty()
  postalCode: string;

  @ApiProperty()
  country: string;

  @ApiProperty({ nullable: true })
  phone?: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty({ nullable: true })
  notes?: string;

  @ApiProperty({ nullable: true, example: -34.603722 })
  latitude?: number;

  @ApiProperty({ nullable: true, example: -58.381592 })
  longitude?: number;

  @ApiProperty()
  createdAt: Date;
}

export class UserDetailDto {
  @ApiProperty()
  id: UUID;

  @ApiProperty()
  name: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [AddressDto] })
  addresses: AddressDto[];

  static fromEntity(user: User): UserDetailDto {
    const dto = new UserDetailDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.lastName = user.lastName;
    dto.email = user.email;
    dto.role = user.role?.name ?? '';
    dto.isActive = user.isActive;
    dto.createdAt = user.createdAt;
    dto.addresses = (user.addresses || []).map((address) => ({
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
      latitude:
        address.latitude !== undefined && address.latitude !== null
          ? Number(address.latitude)
          : undefined,
      longitude:
        address.longitude !== undefined && address.longitude !== null
          ? Number(address.longitude)
          : undefined,
      createdAt: address.createdAt,
    }));
    return dto;
  }
}

