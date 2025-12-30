import { IsString, MaxLength, MinLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type UUID } from 'crypto';

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

  @ApiPropertyOptional({ example: 'asd2-12as-das2-sa14', description: 'Image ID' })
  @IsOptional()
  @IsUUID()
  imageId?: UUID;
}
