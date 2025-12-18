import {
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
  IsOptional,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataType } from '../entities/characteristic.entity';

export class CreateCharacteristicDto {
  @ApiProperty({ example: 'Weight' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: DataType, example: DataType.NUMBER })
  @IsEnum(DataType)
  dataType: DataType;

  @ApiPropertyOptional({ example: 1, description: 'Unit ID for the characteristic' })
  @IsOptional()
  @IsInt()
  unitId?: number;
}
