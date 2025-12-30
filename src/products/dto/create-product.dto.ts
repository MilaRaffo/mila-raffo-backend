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
  @ApiProperty({ example: 'fsds3-0sdf-fsdf2-fdsf3' })
  @IsUUID()
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

  @ApiPropertyOptional({
    example: [1, 2],
    type: [Number],
    description: 'Array of category IDs',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @IsUUID(4)
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
