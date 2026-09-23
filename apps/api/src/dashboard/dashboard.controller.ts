import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { SessionGuard } from '../auth/guards/session.guard.js';
import type { AuthUser } from '../auth/auth-user.js';
import { DashboardService } from './dashboard.service.js';
import { QuerySummaryDto } from './dto/query-summary.dto.js';
import { QueryTrendDto } from './dto/query-trend.dto.js';

const DEFAULT_TREND_MONTHS = 12;

@UseGuards(SessionGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser, @Query() query: QuerySummaryDto) {
    return this.dashboard.summary(user.sub, query.month);
  }

  @Get('trend')
  trend(@CurrentUser() user: AuthUser, @Query() query: QueryTrendDto) {
    return this.dashboard.trend(user.sub, query.months ?? DEFAULT_TREND_MONTHS);
  }
}
