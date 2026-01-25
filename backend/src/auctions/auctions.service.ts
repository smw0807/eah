import { Injectable, Logger } from '@nestjs/common';
import { Auction, AuctionStatus, Prisma } from 'generated/prisma/client';
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
    const where: Prisma.AuctionWhereInput = {
      AND: [
        category && category !== 'ALL' ? { category: { code: category } } : {},
        (minPrice && minPrice > 0) || (maxPrice && maxPrice > 0)
          ? { currentPrice: { gte: minPrice ?? 0, lte: maxPrice ?? 0 } }
          : {},
        search && search.length > 0
          ? {
              OR: [
                { title: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {},
      ],
    };
    let orderBy: Prisma.AuctionOrderByWithRelationInput = {};
    if (sort === 'createdAt') {
      orderBy = {
        createdAt: Prisma.SortOrder.desc,
      };
    } else if (sort === 'minPrice') {
      orderBy = {
        currentPrice: Prisma.SortOrder.asc,
      };
    } else if (sort === 'maxPrice') {
      orderBy = {
        currentPrice: Prisma.SortOrder.desc,
      };
    }
    const auctions = await this.prisma.auction.findMany({
      where,
      include: {
        seller: {
          select: {
            name: true,
            nickname: true,
            email: true,
          },
        },
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
      orderBy,
    });
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
}
