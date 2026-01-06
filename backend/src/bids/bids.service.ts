import { Injectable, Logger } from '@nestjs/common';
import { Bid, Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BidsService {
  private readonly logger = new Logger(BidsService.name);
  constructor(private readonly prisma: PrismaService) {}

  // 전체 입찰 내역 조회
  async getBids(): Promise<Bid[]> {
    const bids = await this.prisma.bid.findMany({
      include: {
        auction: true,
        bidder: true,
        winningFor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return bids;
  }

  // 사용자 입찰 내역 조회
  async getUserBids(bidderId: number): Promise<Bid[]> {
    const bids = await this.prisma.bid.findMany({
      where: {
        bidderId,
      },
      include: {
        auction: true,
        bidder: true,
        winningFor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return bids;
  }

  // 사용자 입찰 내역 조회 - 닉네임
  async getUserBidsByNickname(nickname: string): Promise<Bid[]> {
    const bids = await this.prisma.bid.findMany({
      where: {
        bidder: { nickname: { equals: nickname, mode: 'insensitive' } },
      },
      include: {
        auction: true,
        bidder: true,
        winningFor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return bids;
  }

  // 사용자 입찰 내역 조회
  async getUserBidsById(userId: number): Promise<Bid[]> {
    const bids = await this.prisma.bid.findMany({
      where: { bidderId: userId },
      include: {
        auction: true,
        bidder: true,
        winningFor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return bids;
  }

  // 경매 입찰 내역 조회
  async getAuctionBids(auctionId: number): Promise<Bid[]> {
    const bids = await this.prisma.bid.findMany({
      where: { auctionId },
      include: {
        auction: true,
        bidder: true,
        winningFor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return bids;
  }

  // 입찰 생성
  async createBid(data: {
    auctionId: number;
    bidderId: number;
    amount: number | string | Prisma.Decimal;
  }): Promise<Bid> {
    const createdBid = await this.prisma.bid.create({
      data: {
        auctionId: data.auctionId,
        bidderId: data.bidderId,
        amount: data.amount,
      },
    });
    return createdBid;
  }

  // 입찰 수정
  async updateBid(
    id: number,
    amount: number | string | Prisma.Decimal,
  ): Promise<Bid> {
    const updatedBid = await this.prisma.bid.update({
      where: { id },
      data: { amount },
    });
    return updatedBid;
  }

  // 입찰 삭제
  async deleteBid(id: number): Promise<void> {
    await this.prisma.bid.delete({
      where: { id },
    });
  }
}
