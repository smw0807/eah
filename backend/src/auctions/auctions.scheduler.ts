import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuctionStatus, Prisma } from 'generated/prisma/client';
import { AuctionsGateway } from './auctions.gateway';
import { AccountsService } from 'src/accounts/accounts.service';

@Injectable()
export class AuctionsScheduler {
  private readonly logger = new Logger(AuctionsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auctionsGateway: AuctionsGateway,
    private readonly accountsService: AccountsService,
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

    const scheduledAuctions = await this.prisma.auction.findMany({
      where: {
        status: AuctionStatus.SCHEDULED,
        startAt: {
          lte: now, // startAt <= now
        },
      },
    });

    if (scheduledAuctions.length === 0) {
      return;
    }

    this.logger.log(`${scheduledAuctions.length}개의 경매를 시작 처리합니다.`);

    for (const auction of scheduledAuctions) {
      await this.prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: AuctionStatus.OPEN,
        },
      });

      // WebSocket으로 상태 변경 브로드캐스트
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
        endAt: {
          lte: now, // endAt <= now
        },
      },
      include: {
        seller: true,
        bids: {
          include: {
            bidder: true,
          },
          orderBy: {
            amount: 'desc',
          },
        },
      },
    });

    if (expiredAuctions.length === 0) {
      return;
    }

    this.logger.log(`${expiredAuctions.length}개의 경매를 종료 처리합니다.`);

    for (const auction of expiredAuctions) {
      try {
        const highestBid = auction.bids[0];

        // 경매 상태를 CLOSED로 변경
        await this.prisma.auction.update({
          where: { id: auction.id },
          data: {
            status: AuctionStatus.CLOSED,
            winningBidId: highestBid ? highestBid.id : null,
          },
        });

        // 입찰 내역이 있는 경우 금액 정산 처리
        if (auction.bids.length > 0) {
          await this.settleAuction(auction.id, auction.sellerId, highestBid);
        } else {
          this.logger.log(
            `경매 ID ${auction.id}: 입찰 내역이 없어 금액 정산을 건너뜁니다.`,
          );
        }

        // WebSocket으로 상태 변경 브로드캐스트
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

  // 경매 종료 시 금액 정산 처리
  private async settleAuction(
    auctionId: number,
    sellerId: number,
    winningBid:
      | { id: number; bidderId: number; amount: Prisma.Decimal }
      | undefined,
  ) {
    if (!winningBid) {
      // 낙찰자가 없는 경우: 모든 입찰자들의 잠금 금액 해제
      this.logger.log(`경매 ID ${auctionId}: 낙찰자가 없습니다.`);
      return;
    }

    // 1. 낙찰자가 있는 경우
    const winningAmount = winningBid.amount.toNumber();
    const winningBidderId = winningBid.bidderId;

    this.logger.log(
      `경매 ID ${auctionId}: 낙찰 금액 ${winningAmount}원, 낙찰자 ${winningBidderId}, 판매자 ${sellerId}`,
    );

    // 2. 낙찰자의 잠금 금액 해제
    try {
      await this.accountsService.deductWinningBidAmount(
        winningBidderId,
        winningAmount,
      );
      this.logger.log(
        `낙찰자 ${winningBidderId}의 잠금 금액 ${winningAmount}원 해제 완료`,
      );
    } catch (error: any) {
      this.logger.error(
        `낙찰자 ${winningBidderId}의 잠금 금액 해제 실패: ${error?.message}`,
      );
      throw error;
    }

    // 3. 판매자에게 낙찰 금액 입금
    try {
      await this.accountsService.depositToSeller(sellerId, winningAmount);
      this.logger.log(
        `판매자 ${sellerId}에게 낙찰 금액 ${winningAmount}원 입금 완료`,
      );
    } catch (error: any) {
      this.logger.error(`판매자 ${sellerId}에게 입금 실패: ${error?.message}`);
      throw error;
    }

    this.logger.log(
      `경매 ID ${auctionId} 금액 정산 완료: 낙찰자 ${winningBidderId} → 판매자 ${sellerId} (${winningAmount}원)`,
    );
  }
}
