import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { AuctionCreateInput } from 'generated/prisma/models';
import { CurrentUser } from 'src/auth/decorator/current.user';
import { User } from 'generated/prisma/client';
import { SearchAuctionsQuery } from './models/search.model';

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getAuctions(
    @Query('category')
    category: SearchAuctionsQuery['category'],
    @Query('sort')
    sort: SearchAuctionsQuery['sort'],
    @Query('minPrice')
    minPrice: SearchAuctionsQuery['minPrice'],
    @Query('maxPrice')
    maxPrice: SearchAuctionsQuery['maxPrice'],
    @Query('search')
    search: SearchAuctionsQuery['search'],
    @Query('status')
    status: SearchAuctionsQuery['status'],
  ) {
    return this.auctionsService.getAuctions(
      category,
      sort,
      minPrice,
      maxPrice,
      search,
      status,
    );
  }

  @Post()
  @UseGuards(AuthGuard)
  async createAuction(
    @Body()
    auction: AuctionCreateInput & { categoryId: number; subCategoryId: number },
    @CurrentUser() user: User,
  ) {
    if (!auction.categoryId || !auction.subCategoryId) {
      throw new BadRequestException('카테고리와 서브카테고리를 선택해주세요.');
    }
    if (
      typeof auction.categoryId !== 'number' ||
      typeof auction.subCategoryId !== 'number'
    ) {
      throw new BadRequestException(
        '카테고리와 서브카테고리는 숫자여야 합니다.',
      );
    }
    if (auction.categoryId <= 0 || auction.subCategoryId <= 0) {
      throw new BadRequestException(
        '카테고리와 서브카테고리는 양수여야 합니다.',
      );
    }
    if (auction.startAt >= auction.endAt) {
      throw new BadRequestException(
        '시작일시는 종료일시보다 이전일 수 없습니다.',
      );
    }

    if (auction.imageUrl && !auction.imageUrl.startsWith('https://')) {
      throw new BadRequestException('이미지 URL은 유효한 URL이어야 합니다.');
    }
    return this.auctionsService.createAuction(auction, user.id);
  }

  // 현재 진행중인 경매 상품인지 확인
  @Get('current')
  @UseGuards(AuthGuard)
  async isCurrentAuction(
    @Query('auctionId')
    auctionId: number,
  ) {
    return this.auctionsService.isCurrentAuction(+auctionId);
  }

  // 경매 상세 정보 조회
  @Get(':id')
  @UseGuards(AuthGuard)
  async getAuctionDetail(
    @Param('id')
    id: number,
  ) {
    return this.auctionsService.getAuctionDetail(+id);
  }
}
