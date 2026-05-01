import { PartialType } from '@nestjs/swagger';
import { CreateSectionItemDto } from './create-section-item.dto';

export class UpdateSectionItemDto extends PartialType(CreateSectionItemDto) {}
