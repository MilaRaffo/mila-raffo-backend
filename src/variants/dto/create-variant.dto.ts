import {
  IsString,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
  IsInt,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 'HB-001-BLK' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  sku: string;

  @ApiProperty({ example: 349.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: [1, 2],
    type: [Number],
    description: 'Array of leather IDs',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  leatherIds?: number[];
}
