import { Test, TestingModule } from '@nestjs/testing';
import { AuctionStatus } from 'generated/prisma/client';
import { AuctionsService } from './auctions.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuctionDto } from './dto/create-auction.dto';

describe('AuctionsService', () => {
  let service: AuctionsService;
  let prisma: {
    $transaction: jest.Mock;
    auction: {
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((arg: unknown) =>
        Array.isArray(arg) ? Promise.all(arg as unknown[]) : (arg as any)(prisma),
      ),
      auction: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AuctionsService);
  });

  describe('getAuctions 가격 필터', () => {
    const whereOf = () => {
      const arg = prisma.auction.findMany.mock.calls[0][0];
      return (arg.where.AND as Array<Record<string, unknown>>).filter(
        (c) => Object.keys(c).length > 0,
      );
    };

    it('minPrice 만 주면 gte 조건만 생성한다 (lte:0 으로 전체가 걸러지지 않음)', async () => {
      await service.getAuctions('ALL', 'createdAt', 500, 0, '', 'ALL', 1, 20);
      expect(whereOf()).toContainEqual({ currentPrice: { gte: 500 } });
    });

    it('maxPrice 만 주면 lte 조건만 생성한다', async () => {
      await service.getAuctions('ALL', 'createdAt', 0, 3000, '', 'ALL', 1, 20);
      expect(whereOf()).toContainEqual({ currentPrice: { lte: 3000 } });
    });

    it('가격 조건이 없으면 currentPrice 필터를 만들지 않는다', async () => {
      await service.getAuctions('ALL', 'createdAt', 0, 0, '', 'ALL', 1, 20);
      expect(
        whereOf().some((c) => 'currentPrice' in c),
      ).toBe(false);
    });

    it('표준 페이지네이션 응답을 반환한다', async () => {
      prisma.auction.count.mockResolvedValue(42);
      const res = await service.getAuctions(
        'ALL', 'createdAt', 0, 0, '', 'ALL', 2, 10,
      );
      expect(res).toMatchObject({ total: 42, page: 2, limit: 10 });
    });
  });

  describe('createAuction 상태 결정', () => {
    const base: CreateAuctionDto = {
      title: '테스트 상품',
      description: '설명',
      startPrice: 1000,
      minBidStep: 100,
      buyoutPrice: 5000,
      categoryId: 1,
      subCategoryId: 2,
      imageUrl: null,
      startAt: new Date().toISOString(),
      endAt: new Date().toISOString(),
    };

    it('시작 시간이 과거면 OPEN 으로 생성한다', async () => {
      await service.createAuction(
        { ...base, startAt: new Date(Date.now() - 1000).toISOString() },
        10,
      );
      expect(prisma.auction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: AuctionStatus.OPEN }),
        }),
      );
    });

    it('시작 시간이 미래면 SCHEDULED 로 생성한다', async () => {
      await service.createAuction(
        { ...base, startAt: new Date(Date.now() + 60_000).toISOString() },
        10,
      );
      expect(prisma.auction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: AuctionStatus.SCHEDULED }),
        }),
      );
    });
  });
});
