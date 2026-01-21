import { Injectable, Logger } from '@nestjs/common';
import { Auction, AuctionStatus } from 'generated/prisma/client';
import { AuctionCreateInput } from 'generated/prisma/models';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchAuctionsQuery } from './models/search.model';

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
  ): Promise<Auction[]> {
    const auctions = await this.prisma.auction.findMany({
      orderBy: {
        [sort as keyof Auction]: sort,
      } as any,
      where: {
        ...(category && category.length > 0
          ? { category: { code: category } }
          : {}),
        ...(minPrice && minPrice > 0
          ? { currentPrice: { gte: minPrice } }
          : {}),
        ...(maxPrice && maxPrice > 0
          ? { currentPrice: { lte: maxPrice } }
          : {}),
        ...(search && search.length > 0 ? { title: { contains: search } } : {}),
      },
      include: {
        seller: true,
        category: true,
        subCategory: true,
        bids: {
          include: {
            bidder: true,
          },
          orderBy: {
            createdAt: sort === 'createdAt' ? 'desc' : 'asc',
          } as any,
        },
      },
    });
    console.log(auctions);
    return auctions;
  }

  // 경매 생성
  async createAuction(
    auction: AuctionCreateInput & { categoryId: number; subCategoryId: number },
    sellerId: number,
  ): Promise<Auction> {
    const newAuction = await this.prisma.auction.create({
      data: {
        title: auction.title,
        description: auction.description ?? null,
        status: AuctionStatus.SCHEDULED,
        startPrice: auction.startPrice,
        minBidStep: auction.minBidStep,
        currentPrice: auction.currentPrice ?? null,
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
}
