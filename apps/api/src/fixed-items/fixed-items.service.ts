import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { FixedItem } from '@prisma/client';
import { CategoriesService } from '../categories/categories.service.js';
import { isForeignKeyConstraintViolation } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateFixedItemDto } from './dto/create-fixed-item.dto.js';
import type { UpdateFixedItemDto } from './dto/update-fixed-item.dto.js';

@Injectable()
export class FixedItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
  ) {}

  findAll(userId: string): Promise<FixedItem[]> {
    return this.prisma.fixedItem.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string): Promise<FixedItem> {
    const item = await this.prisma.fixedItem.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Item fixo não encontrado');
    return item;
  }

  async create(userId: string, dto: CreateFixedItemDto): Promise<FixedItem> {
    if (dto.categoryId) await this.categories.findOne(userId, dto.categoryId);
    return this.prisma.fixedItem.create({
      data: {
        userId,
        name: dto.name,
        defaultBudget: dto.defaultBudget,
        role: dto.role,
        categoryId: dto.categoryId,
        active: dto.active,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateFixedItemDto): Promise<FixedItem> {
    await this.findOne(userId, id);
    if (dto.categoryId) await this.categories.findOne(userId, dto.categoryId);
    return this.prisma.fixedItem.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    try {
      await this.prisma.fixedItem.delete({ where: { id } });
    } catch (err) {
      if (isForeignKeyConstraintViolation(err)) {
        throw new ConflictException(
          'Item fixo tem lançamentos associados — desative-o (active: false) em vez de excluir.',
        );
      }
      throw err;
    }
  }
}
