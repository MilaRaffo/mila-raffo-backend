import {
  IsString,
  IsEnum,
  IsInt,
  IsBoolean,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  IsObject,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SectionType } from '../entities/section.entity';

export class CreateSectionDto {
  @ApiProperty({ enum: SectionType })
  @IsEnum(SectionType)
  type: SectionType;

  @ApiProperty({ example: 'Hero Section' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Welcome to our store' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string;

  @ApiProperty({ example: 'hero-main' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  order?: number;
}
