import { Matches } from 'class-validator';

export class QuerySummaryDto {
  @Matches(/^\d{4}-\d{2}$/, { message: 'month deve estar no formato YYYY-MM' })
  month!: string;
}
