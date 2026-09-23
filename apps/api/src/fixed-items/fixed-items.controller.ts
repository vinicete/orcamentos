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
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { SessionGuard } from '../auth/guards/session.guard.js';
import type { AuthUser } from '../auth/auth-user.js';
import { CreateFixedItemDto } from './dto/create-fixed-item.dto.js';
import { UpdateFixedItemDto } from './dto/update-fixed-item.dto.js';
import { FixedItemsService } from './fixed-items.service.js';

@UseGuards(SessionGuard)
@Controller('fixed-items')
export class FixedItemsController {
  constructor(private readonly fixedItems: FixedItemsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.fixedItems.findAll(user.sub);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFixedItemDto) {
    return this.fixedItems.create(user.sub, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFixedItemDto,
  ) {
    return this.fixedItems.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.fixedItems.remove(user.sub, id);
  }
}
