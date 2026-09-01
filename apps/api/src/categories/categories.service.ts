import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Category } from '@prisma/client';
import {
  isForeignKeyConstraintViolation,
  isUniqueConstraintViolation,
} from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(userId: string, id: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const order = dto.order ?? (await this.nextOrder(userId));
    try {
      return await this.prisma.category.create({
        data: { userId, name: dto.name, order },
      });
    } catch (err) {
      if (isUniqueConstraintViolation(err)) {
        throw new ConflictException('Já existe uma categoria com esse nome.');
      }
      throw err;
    }
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(userId, id);
    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (err) {
      if (isUniqueConstraintViolation(err)) {
        throw new ConflictException('Já existe uma categoria com esse nome.');
      }
      throw err;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (err) {
      if (isForeignKeyConstraintViolation(err)) {
        throw new ConflictException(
          'Categoria em uso por lançamentos ou itens fixos — não pode ser removida.',
        );
      }
      throw err;
    }
  }

  private async nextOrder(userId: string): Promise<number> {
    const last = await this.prisma.category.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
    });
    return (last?.order ?? -1) + 1;
  }
}
