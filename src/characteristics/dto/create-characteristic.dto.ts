import {
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
  IsOptional
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataType, MeasureUnits } from '../../common/enums/characteristics.enum';

export class CreateCharacteristicDto {
  @ApiProperty({ example: 'Weight' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: DataType, example: DataType.NUMBER })
  @IsEnum(DataType)
  dataType: DataType;

  @ApiPropertyOptional({ enum: MeasureUnits, example: MeasureUnits.KILOGRAM })
  @IsOptional()
  @IsEnum(MeasureUnits)
  units: MeasureUnits;
}
