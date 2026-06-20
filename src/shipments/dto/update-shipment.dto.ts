import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentStatus } from '../entities/shipment.entity';

export class UpdateShipmentDto {
  @ApiPropertyOptional({ enum: ShipmentStatus })
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @ApiPropertyOptional({ example: 'Olva Courier' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  courier?: string;

  @ApiPropertyOptional({ example: 'TRACK123456' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;
}
