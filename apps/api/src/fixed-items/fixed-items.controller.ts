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
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import type { JwtPayload } from '../auth/jwt-payload.js';
import { CreateFixedItemDto } from './dto/create-fixed-item.dto.js';
import { UpdateFixedItemDto } from './dto/update-fixed-item.dto.js';
import { FixedItemsService } from './fixed-items.service.js';

@UseGuards(JwtAccessGuard)
@Controller('fixed-items')
export class FixedItemsController {
  constructor(private readonly fixedItems: FixedItemsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.fixedItems.findAll(user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFixedItemDto) {
    return this.fixedItems.create(user.sub, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFixedItemDto,
  ) {
    return this.fixedItems.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.fixedItems.remove(user.sub, id);
  }
}
