import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutDto {
  @ApiPropertyOptional({ 
    description: 'Refresh token to invalidate (optional, will invalidate both access and refresh if provided)' 
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
