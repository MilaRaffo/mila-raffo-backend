import { IsString, MaxLength, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateImageDto {
  @ApiPropertyOptional({ example: 1, description: 'Variant ID' })
  @IsOptional()
  @IsInt()
  variantId?: number;

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
