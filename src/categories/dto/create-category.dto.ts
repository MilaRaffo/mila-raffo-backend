import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';
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

  @ApiPropertyOptional({ example: 1, description: 'Parent category ID' })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
