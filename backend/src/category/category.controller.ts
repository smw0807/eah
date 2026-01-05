import {
  Controller,
  Get,
  Logger,
  Body,
  Post,
  Put,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { RBAC } from 'src/auth/decorator/rbac';
import { Role } from 'generated/prisma/enums';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';
@Controller('category')
export class CategoryController {
  private readonly logger = new Logger(CategoryController.name);
  constructor(private readonly categoryService: CategoryService) {}

  // 카테고리 조회
  @Get()
  @RBAC(Role.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  async getCategories() {
    return this.categoryService.getCategories();
  }

  // 최상위 카테고리 조회
  @Get('get-top-categories')
  @RBAC(Role.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  async getTopCategories() {
    return this.categoryService.getTopCategories();
  }

  // 카테고리 생성
  @RBAC(Role.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  @Post('create')
  async createCategory(@Body() body: { code: string; name: string }) {
    const { code, name } = body;
    if (!name) {
      throw new BadRequestException('카테고리 이름을 입력해주세요.');
    }
    if (!code) {
      throw new BadRequestException('카테고리 코드를 입력해주세요.');
    }
    return this.categoryService.createCategory(code, name);
  }

  // 카테고리 수정
  @RBAC(Role.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  @Put('update')
  async updateCategory(@Body() body: { id: number; name: string }) {
    const { id, name } = body;
    if (!id) {
      throw new BadRequestException('카테고리 ID를 입력해주세요.');
    }
    if (!name) {
      throw new BadRequestException('카테고리 이름을 입력해주세요.');
    }
    return this.categoryService.updateCategory(id, name);
  }

  // 카테고리 삭제
  @RBAC(Role.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  @Delete('delete')
  async deleteCategory(@Body() body: { id: number }) {
    const { id } = body;
    if (!id) {
      throw new BadRequestException('카테고리 ID를 입력해주세요.');
    }
    return this.categoryService.deleteCategory(id);
  }

  // 카테고리 하위 카테고리 조회
  @RBAC(Role.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  @Get('get-sub-categories')
  async getSubCategories(@Body() body: { parentId: number }) {
    const { parentId } = body;
    if (!parentId) {
      throw new BadRequestException('부모 카테고리 ID를 입력해주세요.');
    }
    return this.categoryService.getSubCategories(parentId);
  }

  // 카테고리 하위 카테고리 생성
  @RBAC(Role.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  @Post('create-sub-category')
  async createSubCategory(
    @Body() body: { parentId: number; code: string; name: string },
  ) {
    const { parentId, code, name } = body;
    if (!parentId) {
      throw new BadRequestException('부모 카테고리 ID를 입력해주세요.');
    }
    if (!code) {
      throw new BadRequestException('카테고리 코드를 입력해주세요.');
    }
    if (!name) {
      throw new BadRequestException('카테고리 이름을 입력해주세요.');
    }
    return this.categoryService.createSubCategory(parentId, code, name);
  }
}
