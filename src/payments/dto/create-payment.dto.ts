import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment.entity';
import { type UUID } from 'crypto';
import { Type } from 'class-transformer';

export class CulqiAuthentication3dsDto {
  @ApiProperty()
  @IsString()
  eci: string;

  @ApiProperty()
  @IsString()
  xid: string;

  @ApiProperty()
  @IsString()
  cavv: string;

  @ApiProperty()
  @IsString()
  protocolVersion: string;

  @ApiProperty()
  @IsString()
  directoryServerTransactionId: string;
}

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  orderId: UUID;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.TEST })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ example: 'tkn_test_xxxxxxxxxxxx' })
  @ValidateIf(
    (dto: CreatePaymentDto) =>
      dto.method === PaymentMethod.CULQI || dto.sourceId !== undefined,
  )
  @IsString()
  sourceId?: string;

  @ApiPropertyOptional({ example: '8019959c-fab1-49eb-bbbe-b846d308d8df' })
  @ValidateIf(
    (dto: CreatePaymentDto) =>
      dto.method === PaymentMethod.CULQI ||
      dto.deviceFingerprintId !== undefined,
  )
  @IsString()
  deviceFingerprintId?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 48, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(48)
  installments?: number;

  @ApiPropertyOptional({ type: CulqiAuthentication3dsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CulqiAuthentication3dsDto)
  authentication3DS?: CulqiAuthentication3dsDto;
}
