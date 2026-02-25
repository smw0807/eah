import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import {
  AuctionCreateInput,
  AuctionUpdateInput,
} from 'generated/prisma/models';
import { CurrentUser } from 'src/auth/decorator/current.user';
import { AuctionStatus, User } from 'generated/prisma/client';
import { SearchAuctionsQuery } from './models/search.model';
import { BidsService } from 'src/bids/bids.service';
import { AuctionsGateway } from './auctions.gateway';

@Controller('auctions')
export class AuctionsController {
  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly bidsService: BidsService,
    private readonly auctionsGateway: AuctionsGateway,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
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
    @Query('page')
    page: SearchAuctionsQuery['page'],
    @Query('limit')
    limit: SearchAuctionsQuery['limit'],
  ) {
    return this.auctionsService.getAuctions(
      category,
      sort,
      minPrice,
      maxPrice,
      search,
      status,
      page,
      limit,
    );
  }

  // 경매 생성
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

    const subCategory = await this.prisma.category.findUnique({
      where: { id: auction.subCategoryId },
    });
    if (!subCategory) {
      throw new NotFoundException('서브카테고리를 찾을 수 없습니다.');
    }
    if (subCategory.parentId !== auction.categoryId) {
      throw new BadRequestException(
        '선택한 서브카테고리가 해당 카테고리에 속하지 않습니다.',
      );
    }

    return this.auctionsService.createAuction(auction, user.id);
  }

  // 경매 수정
  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateAuction(
    @Param('id')
    id: number,
    @Body() updateAuction: AuctionUpdateInput,
    @CurrentUser() user: User,
  ) {
    const auction = await this.auctionsService.getAuctionDetail(+id);
    if (auction.sellerId !== user.id) {
      throw new BadRequestException('경매 수정 권한이 없습니다.');
    }
    if (auction.status === AuctionStatus.CLOSED) {
      throw new BadRequestException(
        '경매 상태가 종료되었으면 수정할 수 없습니다.',
      );
    }
    if (auction.status === AuctionStatus.CANCELED) {
      throw new BadRequestException(
        '경매 상태가 취소되었으면 수정할 수 없습니다.',
      );
    }
    if (
      updateAuction.startAt &&
      updateAuction.endAt &&
      updateAuction.startAt >= updateAuction.endAt
    ) {
      throw new BadRequestException(
        '시작일시는 종료일시보다 이전일 수 없습니다.',
      );
    }
    if (
      updateAuction.imageUrl &&
      typeof updateAuction.imageUrl === 'string' &&
      !updateAuction.imageUrl.startsWith('https://')
    ) {
      throw new BadRequestException('이미지 URL은 유효한 URL이어야 합니다.');
    }
    if (
      updateAuction.startPrice &&
      typeof updateAuction.startPrice === 'number' &&
      updateAuction.startPrice <= 0
    ) {
      throw new BadRequestException('시작가격은 양수여야 합니다.');
    }
    if (
      updateAuction.minBidStep &&
      typeof updateAuction.minBidStep === 'number' &&
      updateAuction.minBidStep <= 0
    ) {
      throw new BadRequestException('최소 입찰 단위는 양수여야 합니다.');
    }
    if (
      updateAuction.buyoutPrice &&
      typeof updateAuction.buyoutPrice === 'number' &&
      updateAuction.buyoutPrice <= 0
    ) {
      throw new BadRequestException('즉시구매가는 양수여야 합니다.');
    }
    const bids = await this.bidsService.getAuctionBids(+id);
    if (bids.length > 0) {
      throw new BadRequestException('경매에 입찰이 있으면 수정할 수 없습니다.');
    }
    return this.auctionsService.updateAuction(+id, updateAuction);
  }

  // 경매 취소
  @Patch(':id/cancel')
  @UseGuards(AuthGuard)
  async cancelAuction(
    @Param('id')
    id: number,
    @CurrentUser() user: User,
  ) {
    // 경매 주인이 아니면 취소 불가
    const auction = await this.auctionsService.getAuctionDetail(+id);
    if (auction.sellerId !== user.id) {
      throw new BadRequestException('경매 취소 권한이 없습니다.');
    }
    // 경매 존재 확인
    const bids = await this.bidsService.getAuctionBids(+id);
    if (bids.length > 0) {
      throw new BadRequestException('경매에 입찰이 있으면 취소할 수 없습니다.');
    }

    if (auction.status === AuctionStatus.CANCELED) {
      throw new BadRequestException('이미 취소된 경매입니다.');
    }
    if (auction.status === AuctionStatus.CLOSED) {
      throw new BadRequestException('이미 종료된 경매입니다.');
    }

    const canceledAuction = await this.auctionsService.cancelAuction(+id);

    await this.auctionsGateway.handleAuctionStatusChange(
      +id,
      AuctionStatus.CANCELED,
    );
    return canceledAuction;
  }

  // 현재 진행중인 경매 상품인지 확인
  @Get('current')
  async isCurrentAuction(
    @Query('auctionId')
    auctionId: number,
  ) {
    return this.auctionsService.isCurrentAuction(+auctionId);
  }

  // 내가 판매한 경매 목록 조회
  @Get('my-sales')
  @UseGuards(AuthGuard)
  async getMySales(@CurrentUser() user: User) {
    return this.auctionsService.getMySales(+user.id);
  }

  // 나에게 낙찰된 경매 상품
  @Get('my-bids')
  @UseGuards(AuthGuard)
  async getMyBids(@CurrentUser() user: User) {
    return this.auctionsService.getMyBids(+user.id);
  }

  // 경매 상세 정보 조회 (비로그인 접근 허용)
  @Get(':id')
  async getAuctionDetail(
    @Param('id')
    id: number,
  ) {
    return this.auctionsService.getAuctionDetail(+id);
  }
}
