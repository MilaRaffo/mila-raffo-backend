import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment.entity';
import { type UUID } from 'crypto';

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  orderId: UUID;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.TEST })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ example: '4242424242424242' })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiPropertyOptional({ example: '12/25' })
  @IsOptional()
  @IsString()
  cardExpiry?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsOptional()
  @IsString()
  cardCvv?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  cardHolderName?: string;
}
