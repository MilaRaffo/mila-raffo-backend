import { IsString, MaxLength, MinLength, IsOptional, IsUUID, IsBoolean, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type UUID } from 'crypto';

export class CreateLeatherDto {
  @ApiProperty({ example: 'Negro' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'NAPA-001' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: '#000000', description: 'Hexadecimal color code' })
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'hex must be a valid hexadecimal color' })
  hex: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'asd2-12as-das2-sa14', description: 'Image ID' })
  @IsOptional()
  @IsUUID()
  imageId?: UUID;
}
