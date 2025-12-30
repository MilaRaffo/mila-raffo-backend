import {
  IsString,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type UUID } from 'crypto';

export class CreateVariantDto {
  @ApiProperty({ example: 1 })
  @IsUUID()
  productId: UUID;

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
  @IsUUID()
  @ValidateNested({each:true})
  leatherIds?: UUID[];
}
