import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type UUID } from 'crypto';

export class ProductCharacteristicDto {
  @ApiProperty({ example: '1ef214b9-4e81-4019-aa16-ffcfef089459' })
  @IsUUID('4')
  characteristicId: UUID;

  @ApiProperty({ example: '25' })
  @IsString()
  value: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Classic Leather Handbag' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Elegant handcrafted leather handbag' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 299.99 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isCustomizable?: boolean;

  @ApiPropertyOptional({
    example: [
      'b08b8dd6-83d0-47e1-8f32-cee7c3074bd5',
      '9fc314bc-cd44-4d40-9ac3-34121268d1b1',
    ],
    description: 'Array of category IDs',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: UUID[];

  @ApiPropertyOptional({
    example: [{ characteristicId: 'fsds3-0sdf-fsdf2-fdsf3', value: '25' }],
    type: [ProductCharacteristicDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductCharacteristicDto)
  characteristics?: ProductCharacteristicDto[];
}
