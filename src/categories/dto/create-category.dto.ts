import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { type UUID } from 'crypto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Handbags' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'handbags' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug: string;

  @ApiPropertyOptional({ example: 'Luxury leather handbags' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'M213-12SA-9ZXC-2SDA', description: 'Parent category ID' })
  @IsOptional()
  @IsInt()
  parentId?: UUID;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
