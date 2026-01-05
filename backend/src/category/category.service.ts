import { Injectable, Logger } from '@nestjs/common';
import { Category } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  constructor(private readonly prisma: PrismaService) {}

  // 최상위 카테고리 조회
  async getTopCategories(): Promise<Category[]> {
    const topCategories = await this.prisma.category.findMany({
      where: { parentId: null },
    });
    return topCategories;
  }

  // 카테고리 조회
  async getCategories(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return categories;
  }

  // 카테고리 생성
  async createCategory(code: string, name: string): Promise<Category> {
    const newCategory = await this.prisma.category.create({
      data: { code, name },
    });
    return newCategory;
  }

  // 카테고리 수정
  async updateCategory(id: number, name: string): Promise<Category> {
    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: { name },
    });
    return updatedCategory;
  }

  // 카테고리 삭제
  async deleteCategory(id: number): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }

  // 카테고리 하위 카테고리 조회
  async getSubCategories(parentId: number): Promise<Category[]> {
    const subCategories = await this.prisma.category.findMany({
      where: { parentId },
    });
    return subCategories;
  }

  // 카테고리 하위 카테고리 생성
  async createSubCategory(
    parentId: number,
    code: string,
    name: string,
  ): Promise<Category> {
    const newSubCategory = await this.prisma.category.create({
      data: { code, name, parentId },
    });
    return newSubCategory;
  }
}
