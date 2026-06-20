import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notifyOffers?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notifyOrders?: boolean;
}
