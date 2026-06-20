import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export type NotificationType = 'order_status' | 'shipment_status' | 'offer';

export class TestNotificationDto {
  @ApiPropertyOptional({
    enum: ['order_status', 'shipment_status', 'offer'],
    default: 'order_status',
    description: 'Type of notification to simulate',
  })
  @IsIn(['order_status', 'shipment_status', 'offer'])
  @IsOptional()
  type?: NotificationType;
}
