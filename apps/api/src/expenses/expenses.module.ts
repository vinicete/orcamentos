import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module.js';
import { FixedItemsModule } from '../fixed-items/fixed-items.module.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';

@Module({
  imports: [CategoriesModule, FixedItemsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
