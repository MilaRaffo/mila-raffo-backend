import { IsString, MaxLength, IsOptional, IsInt, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type UUID } from 'crypto';

export class CreateImageDto {
  @ApiPropertyOptional({ example: 'SD1W-12S2-SF23-123S', description: 'Variant ID' })
  @IsOptional()
  @IsUUID()
  variantId?: UUID;

  @ApiProperty({ example: 'https://example.com/images/product1.jpg' })
  @IsString()
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional({ example: 'Brown leather handbag' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;
}
