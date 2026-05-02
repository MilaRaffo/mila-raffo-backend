import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { type UUID } from 'crypto';

export class AddColorDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Color ID',
  })
  @IsUUID()
  colorId: UUID;
}
