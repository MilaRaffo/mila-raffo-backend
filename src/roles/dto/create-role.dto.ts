import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleName } from '../entities/role.entity';

export class CreateRoleDto {
  @ApiProperty({ 
    enum: RoleName,
    example: RoleName.CLIENT,
    description: 'Role name (client, admin, or superadmin)'
  })
  @IsEnum(RoleName)
  name: RoleName;

  @ApiPropertyOptional({ 
    example: 'Standard client with basic access',
    description: 'Role description'
  })
  @IsString()
  @IsOptional()
  description?: string;
}
