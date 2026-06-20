import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BroadcastDto {
  @ApiProperty({ example: '¡Nueva oferta!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: 'Descuentos de hasta 40% en toda la colección.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  body: string;
}
