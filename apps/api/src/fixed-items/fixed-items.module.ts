import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module.js';
import { FixedItemsController } from './fixed-items.controller.js';
import { FixedItemsService } from './fixed-items.service.js';

@Module({
  imports: [CategoriesModule],
  controllers: [FixedItemsController],
  providers: [FixedItemsService],
  exports: [FixedItemsService],
})
export class FixedItemsModule {}
