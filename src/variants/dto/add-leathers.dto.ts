import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { type UUID } from 'crypto';

export class AddLeathersDto {
  @ApiProperty({
    example: [1, 2],
    type: [Number],
    description: 'Array of leather IDs to add',
  })
  @IsArray()
  @IsUUID(4)
  @ValidateNested({each:true})
  leatherIds: UUID[];
}
