import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuctionStatus, Bid, Prisma } from 'generated/prisma/client';
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

  // 경매 상품에 마지막 입찰자인지 확인
  async isLastBidder(auctionId: number, userId: number): Promise<boolean> {
    const bids = await this.prisma.bid.findMany({
      where: { auctionId },
      orderBy: { amount: 'desc' },
    });
    if (bids.length === 0) {
      return false;
    }
    return bids[0].bidderId === userId;
  }

  // 즉시구매 생성 (트랜잭션으로 잔액 처리 포함)
  async createBuyout(
    auctionId: number,
    buyerId: number,
    sellerId: number,
    previousBidderId?: number,
    previousAmount?: number,
  ): Promise<Bid> {
    const bid = await this.prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
      });
      if (!auction) {
        throw new NotFoundException('경매를 찾을 수 없습니다.');
      }
      if (!auction.buyoutPrice) {
        throw new BadRequestException('즉시구매 가격이 설정되지 않았습니다.');
      }

      const buyoutAmount = auction.buyoutPrice;

      // 이전 입찰자 잠금 금액 해제
      if (previousBidderId && previousAmount) {
        await tx.userAccount.update({
          where: { userId: previousBidderId },
          data: {
            lockedAmount: { decrement: new Prisma.Decimal(previousAmount) },
            currentAmount: { increment: new Prisma.Decimal(previousAmount) },
          },
        });
      }

      // 즉시구매자 잔액 차감
      await tx.userAccount.update({
        where: { userId: buyerId },
        data: {
          currentAmount: { decrement: buyoutAmount },
        },
      });

      // 판매자에게 입금
      await tx.userAccount.update({
        where: { userId: sellerId },
        data: {
          currentAmount: { increment: buyoutAmount },
        },
      });

      // 즉시구매 입찰 생성
      const createdBid = await tx.bid.create({
        data: { auctionId, bidderId: buyerId, amount: buyoutAmount },
      });

      // 경매 종료 처리
      await tx.auction.update({
        where: { id: auctionId },
        data: {
          winningBidId: createdBid.id,
          status: AuctionStatus.CLOSED,
        },
      });

      return createdBid;
    });

    // WebSocket 브로드캐스트는 트랜잭션 외부에서 실행
    await this.auctionsGateway.handleBidCreated(auctionId);
    await this.auctionsGateway.handleAuctionStatusChange(
      auctionId,
      AuctionStatus.CLOSED,
    );

    return bid;
  }

  // 입찰 생성 (트랜잭션으로 입찰+잔액 처리 원자적 처리)
  async createBid(data: {
    auctionId: number;
    bidderId: number;
    amount: number;
  }): Promise<Bid> {
    const bid = await this.prisma.$transaction(async (tx) => {
      // 이전 최고 입찰 조회
      const previousHighestBid = await tx.bid.findFirst({
        where: { auctionId: data.auctionId },
        orderBy: { amount: 'desc' },
      });

      // 입찰 생성
      const createdBid = await tx.bid.create({
        data: {
          auctionId: data.auctionId,
          bidderId: data.bidderId,
          amount: data.amount,
        },
      });

      // 경매 현재가 업데이트
      await tx.auction.update({
        where: { id: data.auctionId },
        data: { currentPrice: data.amount },
      });

      // 이전 입찰자 잠금 해제
      if (
        previousHighestBid &&
        previousHighestBid.bidderId !== data.bidderId
      ) {
        await tx.userAccount.update({
          where: { userId: previousHighestBid.bidderId },
          data: {
            lockedAmount: { decrement: previousHighestBid.amount },
            currentAmount: { increment: previousHighestBid.amount },
          },
        });
      }

      // 현재 입찰자 잔액 잠금
      await tx.userAccount.update({
        where: { userId: data.bidderId },
        data: {
          lockedAmount: { increment: new Prisma.Decimal(data.amount) },
          currentAmount: { decrement: new Prisma.Decimal(data.amount) },
        },
      });

      return createdBid;
    });

    // WebSocket 브로드캐스트는 트랜잭션 외부에서 실행
    await this.auctionsGateway.handleBidCreated(data.auctionId);

    return bid;
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

  // 내가 입찰한 경매 목록 조회
  async getMyBids(userId: number): Promise<Bid[]> {
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
}
