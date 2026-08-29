import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuctionStatus, Prisma } from 'generated/prisma/client';
import { BidsService } from './bids.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuctionsGateway } from 'src/auctions/auctions.gateway';

const D = (v: number | string) => new Prisma.Decimal(v);
const future = () => new Date(Date.now() + 60 * 60 * 1000);

type PrismaMock = {
  $queryRaw: jest.Mock;
  $transaction: jest.Mock;
  auction: { findUnique: jest.Mock; update: jest.Mock };
  bid: { findFirst: jest.Mock; create: jest.Mock };
  userAccount: { findUnique: jest.Mock; update: jest.Mock };
};

describe('BidsService', () => {
  let service: BidsService;
  let prisma: PrismaMock;
  let gateway: { handleBidCreated: jest.Mock; handleAuctionStatusChange: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn((arg: unknown) =>
        typeof arg === 'function'
          ? (arg as (tx: PrismaMock) => unknown)(prisma)
          : Promise.all(arg as unknown[]),
      ),
      auction: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      bid: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
      userAccount: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    gateway = {
      handleBidCreated: jest.fn().mockResolvedValue(undefined),
      handleAuctionStatusChange: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuctionsGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get(BidsService);
  });

  const openAuction = (over: Partial<Record<string, unknown>> = {}) => ({
    id: 1,
    sellerId: 10,
    status: AuctionStatus.OPEN,
    startPrice: D(1000),
    currentPrice: D(1000),
    minBidStep: D(100),
    buyoutPrice: D(5000),
    endAt: future(),
    ...over,
  });

  describe('createBid', () => {
    const input = { auctionId: 1, bidderId: 20, amount: 1100 };

    it('경매가 없으면 NotFoundException', async () => {
      prisma.auction.findUnique.mockResolvedValue(null);
      await expect(service.createBid(input)).rejects.toThrow(NotFoundException);
    });

    it('진행 중이 아니면 BadRequestException', async () => {
      prisma.auction.findUnique.mockResolvedValue(
        openAuction({ status: AuctionStatus.CLOSED }),
      );
      await expect(service.createBid(input)).rejects.toThrow(BadRequestException);
    });

    it('판매자는 입찰할 수 없다', async () => {
      prisma.auction.findUnique.mockResolvedValue(openAuction());
      await expect(
        service.createBid({ ...input, bidderId: 10 }),
      ).rejects.toThrow('판매자는 입찰할 수 없습니다.');
    });

    it('현재가 + 최소 입찰단위 미만이면 거부', async () => {
      prisma.auction.findUnique.mockResolvedValue(openAuction());
      await expect(
        service.createBid({ ...input, amount: 1050 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('현재 최고 입찰자는 추가 입찰할 수 없다', async () => {
      prisma.auction.findUnique.mockResolvedValue(openAuction());
      prisma.bid.findFirst.mockResolvedValue({ bidderId: 20, amount: D(1000) });
      await expect(service.createBid(input)).rejects.toThrow(
        '현재 최고 입찰자는 추가 입찰할 수 없습니다.',
      );
    });

    it('가용 잔액이 부족하면 거부', async () => {
      prisma.auction.findUnique.mockResolvedValue(openAuction());
      prisma.userAccount.findUnique.mockResolvedValue({
        currentAmount: D(1000),
        lockedAmount: D(0),
      });
      await expect(service.createBid(input)).rejects.toThrow(
        '현재 잔액이 입찰 금액보다 부족합니다.',
      );
    });

    it('정상 입찰: 경매 행 잠금 → 입찰 생성 → 현재가 갱신 → 이전 입찰자 환불 → 본인 잔액 잠금', async () => {
      prisma.auction.findUnique.mockResolvedValue(openAuction());
      prisma.bid.findFirst.mockResolvedValue({ bidderId: 99, amount: D(1000) });
      prisma.userAccount.findUnique.mockResolvedValue({
        currentAmount: D(1_000_000),
        lockedAmount: D(0),
      });
      prisma.bid.create.mockResolvedValue({ id: 7, ...input });

      const result = await service.createBid(input);

      expect(prisma.$queryRaw).toHaveBeenCalled(); // FOR UPDATE 행 잠금
      expect(prisma.auction.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      // 이전 최고 입찰자(99) 환불
      expect(prisma.userAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 99 } }),
      );
      // 본인(20) 잔액 잠금
      expect(prisma.userAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 20 } }),
      );
      expect(gateway.handleBidCreated).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 7, ...input });
    });
  });

  describe('createBuyout', () => {
    it('진행 중이 아니면 거부', async () => {
      prisma.auction.findUnique.mockResolvedValue(
        openAuction({ status: AuctionStatus.CLOSED }),
      );
      await expect(service.createBuyout(1, 20)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('즉시구매가가 없으면 거부', async () => {
      prisma.auction.findUnique.mockResolvedValue(
        openAuction({ buyoutPrice: null }),
      );
      await expect(service.createBuyout(1, 20)).rejects.toThrow(
        '즉시구매 가격이 설정되지 않았습니다.',
      );
    });

    it('판매자는 즉시구매할 수 없다', async () => {
      prisma.auction.findUnique.mockResolvedValue(openAuction());
      await expect(service.createBuyout(1, 10)).rejects.toThrow(
        '판매자는 즉시구매할 수 없습니다.',
      );
    });

    it('가용 잔액이 부족하면 거부', async () => {
      prisma.auction.findUnique.mockResolvedValue(openAuction());
      prisma.userAccount.findUnique.mockResolvedValue({
        currentAmount: D(1000),
        lockedAmount: D(0),
      });
      await expect(service.createBuyout(1, 20)).rejects.toThrow(
        '현재 잔액이 즉시구매 금액보다 부족합니다.',
      );
    });

    it('정상 즉시구매: 이전 입찰자 환불 → 구매자 차감 → 판매자 입금 → 경매 CLOSED + winningBid 설정 + 브로드캐스트', async () => {
      prisma.auction.findUnique.mockResolvedValue(openAuction());
      prisma.userAccount.findUnique.mockResolvedValue({
        currentAmount: D(1_000_000),
        lockedAmount: D(0),
      });
      prisma.bid.findFirst.mockResolvedValue({ bidderId: 99, amount: D(2000) });
      prisma.bid.create.mockResolvedValue({ id: 3 });

      await service.createBuyout(1, 20);

      expect(prisma.userAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 99 } }), // 이전 입찰자 환불
      );
      expect(prisma.userAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 10 } }), // 판매자 입금
      );
      expect(prisma.auction.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { winningBidId: 3, status: AuctionStatus.CLOSED },
      });
      expect(gateway.handleAuctionStatusChange).toHaveBeenCalledWith(
        1,
        AuctionStatus.CLOSED,
      );
    });
  });
});
