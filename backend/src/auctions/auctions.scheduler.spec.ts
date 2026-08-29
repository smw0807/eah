import { Test, TestingModule } from '@nestjs/testing';
import { AuctionStatus, Prisma } from 'generated/prisma/client';
import { AuctionsScheduler } from './auctions.scheduler';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuctionsGateway } from './auctions.gateway';

const D = (v: number) => new Prisma.Decimal(v);

describe('AuctionsScheduler - 경매 종료 정산', () => {
  let scheduler: AuctionsScheduler;
  let prisma: {
    $transaction: jest.Mock;
    auction: { updateMany: jest.Mock; findMany: jest.Mock; update: jest.Mock };
    userAccount: { update: jest.Mock };
  };
  let gateway: { handleAuctionStatusChange: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
      auction: {
        // 시작 예정 경매 없음 -> 스케줄러 앞단은 no-op
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      userAccount: { update: jest.fn().mockResolvedValue({}) },
    };
    gateway = {
      handleAuctionStatusChange: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionsScheduler,
        { provide: PrismaService, useValue: prisma },
        { provide: AuctionsGateway, useValue: gateway },
      ],
    }).compile();

    scheduler = module.get(AuctionsScheduler);
  });

  it('낙찰자가 있으면: 경매 CLOSED + 낙찰자 잠금 해제 + 판매자 입금 + 브로드캐스트', async () => {
    prisma.auction.findMany.mockResolvedValue([
      {
        id: 1,
        sellerId: 10,
        status: AuctionStatus.OPEN,
        bids: [
          { id: 55, bidderId: 20, amount: D(3000) },
          { id: 54, bidderId: 21, amount: D(2000) },
        ],
      },
    ]);

    await scheduler.handleAuctionScheduler();

    expect(prisma.auction.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: AuctionStatus.CLOSED, winningBidId: 55 },
    });
    // 낙찰자(20) 잠금 금액 해제
    expect(prisma.userAccount.update).toHaveBeenCalledWith({
      where: { userId: 20 },
      data: { lockedAmount: { decrement: D(3000) } },
    });
    // 판매자(10) 입금
    expect(prisma.userAccount.update).toHaveBeenCalledWith({
      where: { userId: 10 },
      data: { currentAmount: { increment: D(3000) } },
    });
    expect(gateway.handleAuctionStatusChange).toHaveBeenCalledWith(
      1,
      AuctionStatus.CLOSED,
    );
  });

  it('입찰이 없으면: 경매만 CLOSED 처리하고 잔액 이동은 없다', async () => {
    prisma.auction.findMany.mockResolvedValue([
      { id: 2, sellerId: 10, status: AuctionStatus.OPEN, bids: [] },
    ]);

    await scheduler.handleAuctionScheduler();

    expect(prisma.auction.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { status: AuctionStatus.CLOSED, winningBidId: null },
    });
    expect(prisma.userAccount.update).not.toHaveBeenCalled();
  });

  it('종료 대상 경매가 없으면 아무 것도 하지 않는다', async () => {
    prisma.auction.findMany.mockResolvedValue([]);
    await scheduler.handleAuctionScheduler();
    expect(prisma.auction.update).not.toHaveBeenCalled();
    expect(gateway.handleAuctionStatusChange).not.toHaveBeenCalled();
  });
});
