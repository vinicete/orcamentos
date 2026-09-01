import { TipoLancamento } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateExpenseDto {
  @IsDateString()
  date!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsEnum(TipoLancamento)
  type!: TipoLancamento;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsUUID()
  fixedItemId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
