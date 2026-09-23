import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { SessionGuard } from '../auth/guards/session.guard.js';
import type { AuthUser } from '../auth/auth-user.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { QueryExpensesDto } from './dto/query-expenses.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { ExpensesService } from './expenses.service.js';

@UseGuards(SessionGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryExpensesDto) {
    return this.expenses.findAll(user.sub, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    return this.expenses.create(user.sub, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenses.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.expenses.remove(user.sub, id);
  }

  @Post('ensure-month/:yyyyMm')
  @HttpCode(HttpStatus.OK)
  ensureMonth(@CurrentUser() user: AuthUser, @Param('yyyyMm') yyyyMm: string) {
    return this.expenses.ensureMonth(user.sub, yyyyMm);
  }
}
