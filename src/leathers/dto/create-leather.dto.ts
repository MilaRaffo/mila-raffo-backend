import { IsString, MaxLength, MinLength, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeatherDto {
  @ApiProperty({ example: 'Italian Napa Leather' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'NAPA-001' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ example: 1, description: 'Image ID' })
  @IsOptional()
  @IsInt()
  imageId?: number;
}
