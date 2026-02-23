import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Param,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BidsService } from './bids.service';
import { BadRequestException } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { CurrentUser } from 'src/auth/decorator/current.user';
import { AuctionStatus, Role, User } from 'generated/prisma/client';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { RBAC } from 'src/auth/decorator/rbac';
import { AccountsService } from 'src/accounts/accounts.service';
import { AuctionsService } from 'src/auctions/auctions.service';

@Controller('bids')
export class BidsController {
  constructor(
    private readonly bidsService: BidsService,
    private readonly auctionsService: AuctionsService,
    private readonly accountsService: AccountsService,
  ) {}

  // 전체 입찰 내역 조회
  @Get()
  async getBids() {
    return this.bidsService.getBids();
  }

  // 사용자 입찰 내역 조회
  @Get('user')
  @UseGuards(AuthGuard)
  async getUserBids(@CurrentUser() user: User) {
    return this.bidsService.getUserBids(user.id);
  }

  // 사용자 입찰 내역 조회 - 닉네임
  @Get('user/nickname/:nickname')
  @UseGuards(AuthGuard, RoleGuard)
  @RBAC(Role.ADMIN)
  async getUserBidsByNickname(@Param('nickname') nickname: string) {
    return this.bidsService.getUserBidsByNickname(nickname);
  }

  // 사용자 입찰 내역 조회 - 이메일
  @Get('user/email/:email')
  @UseGuards(AuthGuard, RoleGuard)
  @RBAC(Role.ADMIN)
  async getUserBidsByEmail(@Param('email') email: string) {
    return this.bidsService.getUserBidsByEmail(email);
  }

  // 사용자 입찰 내역 조회
  @Get('user/:userId')
  @UseGuards(AuthGuard, RoleGuard)
  @RBAC(Role.ADMIN)
  async getUserBidsById(@Param('userId') userId: number) {
    return this.bidsService.getUserBidsById(+userId);
  }

  // 경매 입찰 내역 조회
  @Get('auction/:auctionId')
  @UseGuards(AuthGuard)
  async getAuctionBids(@Param('auctionId') auctionId: number) {
    return this.bidsService.getAuctionBids(+auctionId);
  }

  // 즉시구매 생성
  @Post('buyout')
  @Throttle({ strict: { ttl: 60000, limit: 10 } })
  @UseGuards(AuthGuard)
  async createBuyout(
    @CurrentUser() user: User,
    @Body() body: { auctionId: number },
  ) {
    if (!body.auctionId) {
      throw new BadRequestException('Auction ID is required');
    }
    const auctionId = body.auctionId;

    // 경매 정보 조회
    const auction = await this.auctionsService.getAuctionDetail(+auctionId);
    if (!auction) {
      throw new BadRequestException('경매를 찾을 수 없습니다.');
    }

    // 진행 중인 경매인지 확인
    if (auction.status !== AuctionStatus.OPEN) {
      throw new BadRequestException('진행 중인 경매가 아닙니다.');
    }

    // 즉시구매 가격 확인
    if (!auction.buyoutPrice) {
      throw new BadRequestException('즉시구매 가격이 설정되지 않았습니다.');
    }

    // 판매자는 즉시구매 불가
    if (auction.sellerId === user.id) {
      throw new BadRequestException('판매자는 즉시구매할 수 없습니다.');
    }

    // 사용자 잔액 조회
    const accountBalance = await this.accountsService.getAccountBalance(
      user.id,
    );
    const accountLockedBalance =
      await this.accountsService.getAccountLockedBalance(user.id);

    // 사용 가능한 잔액 계산 (currentAmount - lockedAmount)
    const accountLockedBalanceAmount = accountLockedBalance?.toNumber() ?? 0;
    const accountBalanceAmount = accountBalance?.toNumber() ?? 0;
    const availableBalance = accountBalanceAmount - accountLockedBalanceAmount;
    const buyoutPriceAmount = auction.buyoutPrice.toNumber();

    if (availableBalance < buyoutPriceAmount) {
      throw new BadRequestException(
        '현재 잔액이 즉시구매 금액보다 부족합니다.',
      );
    }

    // 이전 최고 입찰자 정보 조회
    const previousBids = await this.bidsService.getAuctionBids(+auctionId);
    const firstBid = previousBids[0];
    const previousBidderId = firstBid?.bidderId;
    const previousAmount = firstBid?.amount.toNumber();

    // 트랜잭션으로 잔액 처리 + 입찰 생성 + 경매 종료
    await this.bidsService.createBuyout(
      +auctionId,
      user.id,
      auction.sellerId,
      previousBidderId,
      previousAmount,
    );

    return { message: '즉시구매 완료' };
  }

  // 입찰 생성
  @Post('create')
  @Throttle({ strict: { ttl: 60000, limit: 10 } })
  @UseGuards(AuthGuard)
  async createBid(
    @Body()
    body: {
      auctionId: number;
      amount: number;
    },
    @CurrentUser() user: User,
  ) {
    const { auctionId, amount } = body;
    if (!auctionId || !amount) {
      throw new BadRequestException('Auction ID and amount are required');
    }
    if (amount <= 0) {
      throw new BadRequestException('입찰 금액은 0원 이상이어야 합니다.');
    }
    if (amount > 1000000000) {
      throw new BadRequestException('입찰 금액은 10억원을 초과할 수 없습니다.');
    }
    if (amount % 100 !== 0) {
      throw new BadRequestException('입찰 금액은 100원 단위로 입력해주세요.');
    }

    // 경매 상품 조회
    const auction = await this.auctionsService.getAuctionDetail(+auctionId);
    if (!auction) {
      throw new BadRequestException('경매를 찾을 수 없습니다.');
    }

    // 진행 중인 경매인지 확인
    if (auction.status !== AuctionStatus.OPEN) {
      throw new BadRequestException('진행 중인 경매가 아닙니다.');
    }

    // 판매자는 입찰 불가
    if (auction.sellerId === user.id) {
      throw new BadRequestException('판매자는 입찰할 수 없습니다.');
    }

    // 최소 입찰 단계 검증
    const currentPrice = auction.currentPrice?.toNumber() ?? auction.startPrice.toNumber();
    const minBidStep = auction.minBidStep.toNumber();
    if (minBidStep > 0 && amount < currentPrice + minBidStep) {
      throw new BadRequestException(
        `입찰 금액은 현재가(${currentPrice.toLocaleString()}원)보다 최소 ${minBidStep.toLocaleString()}원 이상이어야 합니다.`,
      );
    }

    // 경매 상품에 마지막 입찰자인지 확인
    const isLastBidder = await this.bidsService.isLastBidder(
      +auctionId,
      user.id,
    );
    if (isLastBidder) {
      throw new BadRequestException('마지막 입찰자는 입찰할 수 없습니다.');
    }

    // 사용자 현재 잔액 조회
    const accountBalance = await this.accountsService.getAccountBalance(
      +user.id,
    );
    const accountLockedBalance =
      await this.accountsService.getAccountLockedBalance(+user.id);

    // 사용 가능한 잔액 계산 (currentAmount - lockedAmount)
    const accountBalanceAmount = accountBalance?.toNumber() ?? 0;
    const accountLockedBalanceAmount = accountLockedBalance?.toNumber() ?? 0;
    const availableBalance = accountBalanceAmount - accountLockedBalanceAmount;

    if (availableBalance < amount) {
      throw new BadRequestException('현재 잔액이 입찰 금액보다 부족합니다.');
    }

    // 트랜잭션으로 입찰 생성 + 잔액 처리 + 현재가 업데이트 원자적 처리
    const createdBid = await this.bidsService.createBid({
      auctionId: +auctionId,
      bidderId: user.id,
      amount: amount,
    });

    return createdBid;
  }

  // 입찰 수정
  @Put('update')
  @RBAC(Role.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  async updateBid(@Body() body: { id: number; amount: number }) {
    const { id, amount } = body;
    if (!id || !amount) {
      throw new BadRequestException('Invalid request body');
    }
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    if (amount > 1000000000) {
      throw new BadRequestException('Amount must be less than 1000000000');
    }
    if (amount % 100 !== 0) {
      throw new BadRequestException('Amount must be a multiple of 100');
    }
    return this.bidsService.updateBid(id, amount);
  }

  // 입찰 삭제
  @Delete('delete/:id')
  @RBAC(Role.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  async deleteBid(@Param('id') id: number) {
    return this.bidsService.deleteBid(+id);
  }

  // 내가 입찰한 경매 목록 조회
  @Get('my-bids')
  @UseGuards(AuthGuard)
  async getMyBids(@CurrentUser() user: User) {
    return this.bidsService.getMyBids(+user.id);
  }
}
