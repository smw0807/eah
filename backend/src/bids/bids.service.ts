import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Bid, Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuctionsGateway } from 'src/auctions/auctions.gateway';

@Injectable()
export class BidsService {
  private readonly logger = new Logger(BidsService.name);
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuctionsGateway))
    private readonly auctionsGateway: AuctionsGateway,
  ) {}

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

  // 사용자 입찰 내역 조회 - 이메일
  async getUserBidsByEmail(email: string): Promise<Bid[]> {
    const bids = await this.prisma.bid.findMany({
      where: { bidder: { email: { equals: email, mode: 'insensitive' } } },
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

    // 경매의 현재가 업데이트
    await this.prisma.auction.update({
      where: { id: data.auctionId },
      data: {
        currentPrice: data.amount,
      },
    });

    // WebSocket으로 실시간 업데이트 브로드캐스트
    await this.auctionsGateway.handleBidCreated(data.auctionId);

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
