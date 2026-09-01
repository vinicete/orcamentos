import { PartialType } from '@nestjs/mapped-types';
import { CreateFixedItemDto } from './create-fixed-item.dto.js';

export class UpdateFixedItemDto extends PartialType(CreateFixedItemDto) {}
