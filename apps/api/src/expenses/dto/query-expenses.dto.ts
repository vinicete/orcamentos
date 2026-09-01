import { TipoLancamento } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class QueryExpensesDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month deve estar no formato YYYY-MM' })
  month?: string;

  @IsOptional()
  @IsEnum(TipoLancamento)
  type?: TipoLancamento;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  q?: string;
}
