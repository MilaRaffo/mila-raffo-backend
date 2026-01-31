import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDate,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  IsArray,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PromotionType, PromotionStatus } from '../entities/promotion.entity';
import { type UUID } from 'crypto';

export class CreatePromotionDto {
  @ApiProperty({ example: 'Black Friday 2026' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Descuento especial por Black Friday' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: PromotionType,
    example: PromotionType.PERCENTAGE,
  })
  @IsEnum(PromotionType)
  type: PromotionType;

  @ApiPropertyOptional({ example: 20 })
  @ValidateIf((o) =>
    [PromotionType.PERCENTAGE, PromotionType.FIXED_AMOUNT].includes(o.type),
  )
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ example: 2 })
  @ValidateIf((o) => o.type === PromotionType.BUY_X_GET_Y)
  @IsNumber()
  @Min(1)
  buyQuantity?: number;

  @ApiPropertyOptional({ example: 1 })
  @ValidateIf((o) => o.type === PromotionType.BUY_X_GET_Y)
  @IsNumber()
  @Min(1)
  getQuantity?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumPurchase?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscount?: number;

  @ApiProperty({ example: '2026-11-25T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ example: '2026-11-30T23:59:59.000Z' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({
    enum: PromotionStatus,
    example: PromotionStatus.SCHEDULED,
    default: PromotionStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isStackable?: boolean;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  priority?: number;

  @ApiPropertyOptional({
    example: ['uuid-1', 'uuid-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productIds?: UUID[];

  @ApiPropertyOptional({
    example: ['uuid-1', 'uuid-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: UUID[];
}
