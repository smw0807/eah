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
import { PUBLIC_USER_SELECT } from 'src/common/prisma.selects';
import { paginated, parsePagination, Paginated } from 'src/common/pagination';

// 경매 행 잠금 대기 시간을 감안한 트랜잭션 옵션 (동시 입찰 경합 시 기본 5초로는 부족)
const TX_OPTIONS = { timeout: 15_000, maxWait: 10_000 } as const;

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
        bidder: { select: PUBLIC_USER_SELECT },
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
        bidder: { select: PUBLIC_USER_SELECT },
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
        bidder: { select: PUBLIC_USER_SELECT },
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
        bidder: { select: PUBLIC_USER_SELECT },
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
        bidder: { select: PUBLIC_USER_SELECT },
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
        bidder: { select: PUBLIC_USER_SELECT },
        winningFor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return bids;
  }

  /**
   * 경매 행에 트랜잭션 범위 쓰기 잠금(SELECT ... FOR UPDATE)을 건다.
   * 동일 경매에 대한 동시 입찰/즉시구매를 직렬화하여
   * 현재가·상태·잔액 검증과 갱신을 원자적으로 수행할 수 있게 한다.
   */
  private async lockAuctionRow(
    tx: Prisma.TransactionClient,
    auctionId: number,
  ): Promise<void> {
    await tx.$queryRaw`SELECT id FROM auctions WHERE id = ${auctionId} FOR UPDATE`;
  }

  // 즉시구매 생성 (검증 + 잔액 처리 + 종료를 하나의 트랜잭션에서 원자적으로 처리)
  async createBuyout(auctionId: number, buyerId: number): Promise<Bid> {
    const bid = await this.prisma.$transaction(async (tx) => {
      await this.lockAuctionRow(tx, auctionId);

      const auction = await tx.auction.findUnique({ where: { id: auctionId } });
      if (!auction) {
        throw new NotFoundException('경매를 찾을 수 없습니다.');
      }
      if (auction.status !== AuctionStatus.OPEN) {
        throw new BadRequestException('진행 중인 경매가 아닙니다.');
      }
      if (!auction.buyoutPrice) {
        throw new BadRequestException('즉시구매 가격이 설정되지 않았습니다.');
      }
      if (auction.sellerId === buyerId) {
        throw new BadRequestException('판매자는 즉시구매할 수 없습니다.');
      }

      const buyoutAmount = auction.buyoutPrice;

      const account = await tx.userAccount.findUnique({
        where: { userId: buyerId },
      });
      if (!account) {
        throw new BadRequestException('계좌 정보를 찾을 수 없습니다.');
      }
      const available = account.currentAmount.sub(account.lockedAmount);
      if (available.lessThan(buyoutAmount)) {
        throw new BadRequestException('현재 잔액이 즉시구매 금액보다 부족합니다.');
      }

      // 직전 최고 입찰자의 잠금 금액 해제 (본인이 최고 입찰자였던 경우 포함)
      const previousHighestBid = await tx.bid.findFirst({
        where: { auctionId },
        orderBy: { amount: 'desc' },
      });
      if (previousHighestBid) {
        await tx.userAccount.update({
          where: { userId: previousHighestBid.bidderId },
          data: {
            lockedAmount: { decrement: previousHighestBid.amount },
            currentAmount: { increment: previousHighestBid.amount },
          },
        });
      }

      // 즉시구매자 잔액 차감 / 판매자 입금
      await tx.userAccount.update({
        where: { userId: buyerId },
        data: { currentAmount: { decrement: buyoutAmount } },
      });
      await tx.userAccount.update({
        where: { userId: auction.sellerId },
        data: { currentAmount: { increment: buyoutAmount } },
      });

      const createdBid = await tx.bid.create({
        data: { auctionId, bidderId: buyerId, amount: buyoutAmount },
      });
      await tx.auction.update({
        where: { id: auctionId },
        data: { winningBidId: createdBid.id, status: AuctionStatus.CLOSED },
      });

      return createdBid;
    }, TX_OPTIONS);

    // WebSocket 브로드캐스트는 트랜잭션 외부에서 실행
    await this.auctionsGateway.handleBidCreated(auctionId);
    await this.auctionsGateway.handleAuctionStatusChange(
      auctionId,
      AuctionStatus.CLOSED,
    );

    return bid;
  }

  // 입찰 생성 (검증 + 입찰 + 잔액 처리 + 현재가 갱신을 하나의 트랜잭션에서 원자적으로 처리)
  async createBid(data: {
    auctionId: number;
    bidderId: number;
    amount: number;
  }): Promise<Bid> {
    const amount = new Prisma.Decimal(data.amount);

    const bid = await this.prisma.$transaction(async (tx) => {
      await this.lockAuctionRow(tx, data.auctionId);

      const auction = await tx.auction.findUnique({
        where: { id: data.auctionId },
      });
      if (!auction) {
        throw new NotFoundException('경매를 찾을 수 없습니다.');
      }
      if (auction.status !== AuctionStatus.OPEN) {
        throw new BadRequestException('진행 중인 경매가 아닙니다.');
      }
      if (new Date(auction.endAt) <= new Date()) {
        throw new BadRequestException('이미 종료된 경매입니다.');
      }
      if (auction.sellerId === data.bidderId) {
        throw new BadRequestException('판매자는 입찰할 수 없습니다.');
      }

      // 최소 입찰 단위 검증 (현재가 + minBidStep 이상)
      const currentPrice = auction.currentPrice ?? auction.startPrice;
      const minRequired = currentPrice.add(auction.minBidStep);
      if (amount.lessThan(minRequired)) {
        throw new BadRequestException(
          `입찰 금액은 ${minRequired.toString()}원 이상이어야 합니다.`,
        );
      }

      // 최고 입찰자 본인의 연속 입찰 차단
      const previousHighestBid = await tx.bid.findFirst({
        where: { auctionId: data.auctionId },
        orderBy: { amount: 'desc' },
      });
      if (previousHighestBid?.bidderId === data.bidderId) {
        throw new BadRequestException('현재 최고 입찰자는 추가 입찰할 수 없습니다.');
      }

      // 가용 잔액 검증 (currentAmount - lockedAmount)
      const account = await tx.userAccount.findUnique({
        where: { userId: data.bidderId },
      });
      if (!account) {
        throw new BadRequestException('계좌 정보를 찾을 수 없습니다.');
      }
      const available = account.currentAmount.sub(account.lockedAmount);
      if (available.lessThan(amount)) {
        throw new BadRequestException('현재 잔액이 입찰 금액보다 부족합니다.');
      }

      const createdBid = await tx.bid.create({
        data: {
          auctionId: data.auctionId,
          bidderId: data.bidderId,
          amount,
        },
      });

      await tx.auction.update({
        where: { id: data.auctionId },
        data: { currentPrice: amount },
      });

      // 직전 최고 입찰자 잠금 해제
      if (previousHighestBid && previousHighestBid.bidderId !== data.bidderId) {
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
          lockedAmount: { increment: amount },
          currentAmount: { decrement: amount },
        },
      });

      return createdBid;
    }, TX_OPTIONS);

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

  // 내가 입찰한 경매 목록 조회 (페이지네이션)
  async getMyBids(
    userId: number,
    page?: number | string,
    limit?: number | string,
  ): Promise<Paginated<Bid>> {
    const { skip, take, page: p, limit: l } = parsePagination(page, limit);
    const where = { bidderId: userId };
    const [bids, total] = await this.prisma.$transaction([
      this.prisma.bid.findMany({
        where,
        include: {
          auction: true,
          bidder: { select: PUBLIC_USER_SELECT },
          winningFor: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.bid.count({ where }),
    ]);
    return paginated(bids, total, p, l);
  }
}
