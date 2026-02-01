import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuctionStatus } from 'generated/prisma/client';
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
    this.logger.log('경매 스케줄러 실행');

    try {
      await this.handleScheduledAuctions();
      await this.handleExpiredAuctions();
      this.logger.log('경매 스케줄러 완료');
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
        bids: {
          orderBy: {
            amount: 'desc',
          },
          take: 1, // 가장 높은 입찰만
        },
      },
    });

    if (expiredAuctions.length === 0) {
      this.logger.log('종료할 경매가 없습니다.');
      return;
    }

    this.logger.log(`${expiredAuctions.length}개의 경매를 종료 처리합니다.`);

    for (const auction of expiredAuctions) {
      const highestBid = auction.bids[0];

      await this.prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: AuctionStatus.CLOSED,
          winningBidId: highestBid ? highestBid.id : null,
        },
      });

      // WebSocket으로 상태 변경 브로드캐스트
      await this.auctionsGateway.handleAuctionStatusChange(
        auction.id,
        AuctionStatus.CLOSED,
      );

      this.logger.log(
        `경매 ID ${auction.id} 종료 처리 완료. 낙찰자: ${highestBid ? `Bid ID ${highestBid.id}` : '없음'}`,
      );
    }
  }
}
