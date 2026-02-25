import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuctionStatus, Prisma } from 'generated/prisma/client';
import { AuctionsGateway } from './auctions.gateway';

@Injectable()
export class AuctionsScheduler {
  private readonly logger = new Logger(AuctionsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auctionsGateway: AuctionsGateway,
  ) {}

  // 1분마다 실행
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAuctionScheduler() {
    try {
      await this.handleScheduledAuctions();
      await this.handleExpiredAuctions();
    } catch (error: any) {
      this.logger.error(
        `경매 스케줄러 오류: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
    }
  }

  // 시작 시간이 지난 SCHEDULED 경매를 OPEN으로 변경
  private async handleScheduledAuctions() {
    const now = new Date();

    // updateMany로 한 번에 처리 (개별 update보다 효율적)
    const result = await this.prisma.auction.updateMany({
      where: {
        status: AuctionStatus.SCHEDULED,
        startAt: { lte: now },
      },
      data: { status: AuctionStatus.OPEN },
    });

    if (result.count === 0) return;

    this.logger.log(`${result.count}개의 경매를 시작 처리합니다.`);

    // WebSocket 브로드캐스트: 변경된 경매 목록 조회 후 알림
    const openedAuctions = await this.prisma.auction.findMany({
      where: {
        status: AuctionStatus.OPEN,
        startAt: { lte: now },
        // 방금 열린 항목만: updatedAt이 now에 가까운 것
      },
      select: { id: true },
    });

    for (const auction of openedAuctions) {
      await this.auctionsGateway.handleAuctionStatusChange(
        auction.id,
        AuctionStatus.OPEN,
      );
      this.logger.log(`경매 ID ${auction.id} 시작 처리 완료`);
    }
  }

  // 종료 시간이 지난 OPEN 경매를 CLOSED로 변경
  private async handleExpiredAuctions() {
    const now = new Date();

    const expiredAuctions = await this.prisma.auction.findMany({
      where: {
        status: AuctionStatus.OPEN,
        endAt: { lte: now },
      },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
        },
      },
    });

    if (expiredAuctions.length === 0) return;

    this.logger.log(`${expiredAuctions.length}개의 경매를 종료 처리합니다.`);

    for (const auction of expiredAuctions) {
      try {
        const highestBid = auction.bids[0];

        // 정산 + 상태 변경을 하나의 트랜잭션으로 처리
        await this.prisma.$transaction(async (tx) => {
          // 경매 상태를 CLOSED로 변경
          await tx.auction.update({
            where: { id: auction.id },
            data: {
              status: AuctionStatus.CLOSED,
              winningBidId: highestBid ? highestBid.id : null,
            },
          });

          if (!highestBid) return;

          const winningAmount = highestBid.amount;
          const winningBidderId = highestBid.bidderId;

          // 낙찰자의 잠금 금액 해제 (currentAmount는 입찰 시 이미 차감됨)
          await tx.userAccount.update({
            where: { userId: winningBidderId },
            data: {
              lockedAmount: { decrement: winningAmount },
            },
          });

          // 판매자에게 낙찰 금액 입금
          await tx.userAccount.update({
            where: { userId: auction.sellerId },
            data: {
              currentAmount: { increment: winningAmount },
            },
          });
        });

        // WebSocket 브로드캐스트는 트랜잭션 외부에서 실행
        await this.auctionsGateway.handleAuctionStatusChange(
          auction.id,
          AuctionStatus.CLOSED,
        );

        this.logger.log(
          `경매 ID ${auction.id} 종료 처리 완료. 낙찰자: ${highestBid ? `Bid ID ${highestBid.id} (User ID ${highestBid.bidderId})` : '없음'}`,
        );
      } catch (error: any) {
        this.logger.error(
          `경매 ID ${auction.id} 종료 처리 중 오류 발생: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );
      }
    }
  }
}
