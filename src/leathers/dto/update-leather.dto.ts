import { PartialType } from '@nestjs/swagger';
import { CreateLeatherDto } from './create-leather.dto';

export class UpdateLeatherDto extends PartialType(CreateLeatherDto) {}
