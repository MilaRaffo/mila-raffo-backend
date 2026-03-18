import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationDto {
  @ApiProperty({ default: 10, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ default: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Campo de ordenamiento (ej: name, createdAt, price)',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Dirección de ordenamiento',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  // Filtros comunes para compatibilidad con el dataProvider del frontend.
  @ApiPropertyOptional({ example: 'bolso' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'Classic Leather Handbag' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'admin@milaraffo.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'pending' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: 'NAPA-001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'black' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'handbags' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  productId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  active?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  available?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  isAvailable?: string;
}
