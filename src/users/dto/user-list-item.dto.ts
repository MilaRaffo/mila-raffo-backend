import { ApiProperty } from '@nestjs/swagger';
import { type UUID } from 'crypto';
import { User } from '../entities/user.entity';

export class UserListItemDto {
  @ApiProperty({ example: '0f787dc0-04c9-4b20-b4b9-27a931751739' })
  id: UUID;

  @ApiProperty({ example: 'Pepe' })
  name: string;

  @ApiProperty({ example: 'Pérez' })
  lastName: string;

  @ApiProperty({ example: 'pepe@test.com' })
  email: string;

  @ApiProperty({ example: 'client' })
  role: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  static fromEntity(user: User): UserListItemDto {
    const dto = new UserListItemDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.lastName = user.lastName;
    dto.email = user.email;
    dto.role = user.role?.name ?? '';
    dto.isActive = user.isActive;
    return dto;
  }
}
