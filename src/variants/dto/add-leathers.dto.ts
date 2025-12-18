import { IsInt, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddLeathersDto {
  @ApiProperty({
    example: [1, 2],
    type: [Number],
    description: 'Array of leather IDs to add',
  })
  @IsArray()
  @IsInt({ each: true })
  leatherIds: number[];
}
