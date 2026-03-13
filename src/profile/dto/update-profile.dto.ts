import { PartialType, PickType } from '@nestjs/swagger';
import { CreateUserDto } from '../../users/dto/create-user.dto';

export class UpdateProfileDto extends PartialType(
  PickType(CreateUserDto, ['name', 'lastName', 'email', 'phone'] as const),
) {}
