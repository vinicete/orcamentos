import { FixedItemRole } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateFixedItemDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsNumber()
  @Min(0)
  defaultBudget!: number;

  @IsOptional()
  @IsEnum(FixedItemRole)
  role?: FixedItemRole;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
