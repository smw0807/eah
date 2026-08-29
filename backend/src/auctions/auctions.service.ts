import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Auction, AuctionStatus, Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchAuctionsQuery } from './models/search.model';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import {
  PUBLIC_BID_SELECT,
  PUBLIC_USER_SELECT,
} from 'src/common/prisma.selects';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);
  constructor(private readonly prisma: PrismaService) {}

  // 경매 목록 조회
  async getAuctions(
    category: SearchAuctionsQuery['category'],
    sort: SearchAuctionsQuery['sort'],
    minPrice: SearchAuctionsQuery['minPrice'],
    maxPrice: SearchAuctionsQuery['maxPrice'],
    search: SearchAuctionsQuery['search'],
    status: SearchAuctionsQuery['status'],
    page: SearchAuctionsQuery['page'],
    limit: SearchAuctionsQuery['limit'],
  ): Promise<{ data: Auction[]; total: number; page: number; limit: number }> {
    const PAGE_SIZE = Math.min(Number(limit) || 20, 100);
    const PAGE = Math.max(Number(page) || 1, 1);
    const skip = (PAGE - 1) * PAGE_SIZE;

    // 가격 필터: 전달된 경계만 적용 (한쪽만 주면 그 조건만)
    const min = Number(minPrice);
    const max = Number(maxPrice);
    const priceFilter: { gte?: number; lte?: number } = {};
    if (Number.isFinite(min) && min > 0) priceFilter.gte = min;
    if (Number.isFinite(max) && max > 0) priceFilter.lte = max;
    const keyword = typeof search === 'string' ? search.trim() : '';

    const where: Prisma.AuctionWhereInput = {
      AND: [
        category && category !== 'ALL' ? { category: { code: category } } : {},
        Object.keys(priceFilter).length > 0 ? { currentPrice: priceFilter } : {},
        keyword.length > 0
          ? {
              OR: [
                { title: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
              ],
            }
          : {},
        status && status !== 'ALL' ? { status: status as AuctionStatus } : {},
      ],
    };
    let orderBy: Prisma.AuctionOrderByWithRelationInput = {};
    if (sort === 'createdAt') {
      orderBy = { createdAt: Prisma.SortOrder.desc };
    } else if (sort === 'minPrice') {
      orderBy = { currentPrice: Prisma.SortOrder.asc };
    } else if (sort === 'maxPrice') {
      orderBy = { currentPrice: Prisma.SortOrder.desc };
    }

    const [auctions, total] = await this.prisma.$transaction([
      this.prisma.auction.findMany({
        where,
        include: {
          seller: { select: PUBLIC_USER_SELECT },
          category: true,
          subCategory: true,
          bids: {
            orderBy: { createdAt: Prisma.SortOrder.desc },
            take: 1, // 목록에서는 최신 입찰 1건만 포함
          },
        },
        orderBy,
        skip,
        take: PAGE_SIZE,
      }),
      this.prisma.auction.count({ where }),
    ]);

    return { data: auctions, total, page: PAGE, limit: PAGE_SIZE };
  }

  // 경매 생성
  async createAuction(
    auction: CreateAuctionDto,
    sellerId: number,
  ): Promise<Auction> {
    // 경매 시작일이 현재 시간보다 이전일 경우, 경매 상태를 OPEN으로 변경
    const status =
      new Date(auction.startAt) < new Date()
        ? AuctionStatus.OPEN
        : AuctionStatus.SCHEDULED;
    const newAuction = await this.prisma.auction.create({
      data: {
        title: auction.title,
        description: auction.description ?? null,
        status,
        startPrice: auction.startPrice,
        minBidStep: auction.minBidStep,
        currentPrice: auction.startPrice ?? null,
        buyoutPrice: auction.buyoutPrice ?? null,
        imageUrl: auction.imageUrl ?? null,
        startAt: auction.startAt,
        endAt: auction.endAt,
        category: {
          connect: {
            id: auction.categoryId,
          },
        },
        subCategory: {
          connect: {
            id: auction.subCategoryId,
          },
        },
        seller: {
          connect: {
            id: sellerId,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return newAuction;
  }

  // 경매 수정 (입찰이 없는 경매만 수정 가능하므로 currentPrice도 startPrice에 맞춰 갱신)
  async updateAuction(
    auctionId: number,
    updateAuction: UpdateAuctionDto,
  ): Promise<Auction> {
    const data: Prisma.AuctionUpdateInput = { ...updateAuction };
    if (updateAuction.startPrice != null) {
      data.currentPrice = updateAuction.startPrice;
    }
    const updatedAuction = await this.prisma.auction.update({
      where: { id: auctionId },
      data,
    });
    return updatedAuction;
  }

  // 경매 취소
  async cancelAuction(auctionId: number): Promise<Auction> {
    const auction = await this.prisma.auction.update({
      where: { id: auctionId },
      data: { status: AuctionStatus.CANCELED },
    });
    return auction;
  }

  // 현재 진행중인 경매 상품인지 확인
  async isCurrentAuction(auctionId: number): Promise<boolean> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });
    return auction?.status === AuctionStatus.OPEN;
  }

  // 경매 상세 정보 조회
  async getAuctionDetail(auctionId: number): Promise<Auction> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        seller: { select: PUBLIC_USER_SELECT },
        category: true,
        subCategory: true,
        bids: { select: PUBLIC_BID_SELECT },
        winningBid: { select: PUBLIC_BID_SELECT },
      },
    });
    if (!auction) {
      throw new NotFoundException('경매 상품을 찾을 수 없습니다.');
    }
    return auction;
  }

  // 경매 상품 즉시구매 가격 조회
  async getAuctionBuyoutPrice(
    auctionId: number,
  ): Promise<Prisma.Decimal | null> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });
    if (!auction) {
      throw new NotFoundException('경매 상품을 찾을 수 없습니다.');
    }
    return auction.buyoutPrice;
  }

  // 경매 상품 winning_bid_id 업데이트
  async updateAuctionWinningBidId(
    auctionId: number,
    winningBidId: number,
  ): Promise<Auction> {
    const auction = await this.prisma.auction.update({
      where: { id: auctionId },
      data: { winningBidId, status: AuctionStatus.CLOSED },
    });
    return auction;
  }

  // 내가 판매한 경매 목록 조회
  async getMySales(userId: number): Promise<Auction[]> {
    const auctions = await this.prisma.auction.findMany({
      where: { sellerId: userId },
      include: {
        seller: { select: PUBLIC_USER_SELECT },
        category: true,
        subCategory: true,
        bids: true,
        winningBid: { select: PUBLIC_BID_SELECT },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return auctions;
  }

  // 나에게 낙찰된 경매 목록 조회
  async getMyBids(userId: number): Promise<Auction[]> {
    const auctions = await this.prisma.auction.findMany({
      where: { winningBid: { bidderId: userId } },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        seller: { select: PUBLIC_USER_SELECT },
        category: true,
        subCategory: true,
        bids: true,
        winningBid: { select: PUBLIC_BID_SELECT },
      },
    });
    return auctions;
  }
}
