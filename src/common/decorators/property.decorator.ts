import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiPropertyOptions } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export function IsRequiredProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty(options),
    IsNotEmpty(),
  );
}

export function IsOptionalProperty(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiPropertyOptional(options),
    IsOptional(),
  );
}
