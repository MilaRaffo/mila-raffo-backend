import {
  IsString,
  IsInt,
  IsOptional,
  IsUUID,
  MaxLength,
  IsObject,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type UUID } from 'crypto';

export class CreateSectionItemDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  sectionId: UUID;

  @ApiPropertyOptional({ example: 'Item Title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Image ID' })
  @IsOptional()
  @IsUUID()
  imageId?: UUID;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ example: { customKey: 'value' } })
  @IsOptional()
  @IsObject()
  extraData?: Record<string, any>;
}
