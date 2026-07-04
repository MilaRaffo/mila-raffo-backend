import {
  IsString,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type UUID } from 'crypto';

export class CreateVariantDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  productId: UUID;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Color ID (optional)',
  })
  @IsOptional()
  @IsUUID()
  colorId?: UUID;

  @ApiProperty({ example: 'HB-001-BLK' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  sku: string;

  @ApiProperty({ example: 349.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
