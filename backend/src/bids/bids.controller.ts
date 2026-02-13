import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Param,
} from '@nestjs/common';
import { BidsService } from './bids.service';
import { BadRequestException } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { CurrentUser } from 'src/auth/decorator/current.user';
import {
  AuctionStatus,
  Bid,
  Prisma,
  Role,
  User,
} from 'generated/prisma/client';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { RBAC } from 'src/auth/decorator/rbac';
import { AuctionsGateway } from 'src/auctions/auctions.gateway';
import { AccountsService } from 'src/accounts/accounts.service';
import { AuctionsService } from 'src/auctions/auctions.service';

@Controller('bids')
export class BidsController {
  constructor(
    private readonly bidsService: BidsService,
    private readonly auctionsGateway: AuctionsGateway,
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
  @UseGuards(AuthGuard)
  async createBuyout(
    @CurrentUser() user: User,
    @Body() body: { auctionId: number },
  ) {
    if (!body.auctionId) {
      throw new BadRequestException('Auction ID is required');
    }
    const auctionId = body.auctionId;
    // 경매 상품 즉시구매 가격 조회
    const buyoutPrice =
      await this.auctionsService.getAuctionBuyoutPrice(+auctionId);
    if (!buyoutPrice) {
      throw new BadRequestException('즉시구매 가격이 설정되지 않았습니다.');
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
    const buyoutPriceAmount = buyoutPrice.toNumber();

    if (availableBalance < buyoutPriceAmount) {
      throw new BadRequestException(
        '현재 잔액이 즉시구매 금액보다 부족합니다.',
      );
    }

    // 경매 정보 조회 (판매자 ID 확인용)
    const auction = await this.auctionsService.getAuctionDetail(+auctionId);
    if (!auction) {
      throw new BadRequestException('경매를 찾을 수 없습니다.');
    }

    const previousBids = await this.bidsService.getAuctionBids(+auctionId);

    const firstBid = previousBids[0];

    const lastAmount = firstBid?.amount.toNumber();
    const lastBidderId = firstBid?.bidderId;
    const buyoutAmount = auction.buyoutPrice?.toNumber() ?? 0;

    // 마지막 입찰자 잠금 금액 해제
    await this.accountsService.decrementLockedAmount(+lastBidderId, lastAmount);
    // 즉시구매자 현재 잔액 차감
    await this.accountsService.deductCurrentAmount(+user.id, buyoutAmount);

    // 판매자에게 즉시구매 가격 입금
    const sellerId = auction.sellerId;
    await this.accountsService.depositToSeller(sellerId, buyoutAmount);

    // 즉시구매 생성
    const buyerId = user.id;
    const createdBid = await this.bidsService.createBuyout(+auctionId, buyerId);

    // WebSocket으로 실시간 업데이트 브로드캐스트
    await this.auctionsGateway.handleBidCreated(+auctionId);
    await this.auctionsGateway.handleAuctionStatusChange(
      +auctionId,
      AuctionStatus.CLOSED as AuctionStatus,
    );

    // 경매 상품 winning_bid_id 업데이트
    await this.auctionsService.updateAuctionWinningBidId(
      +auctionId,
      createdBid.id,
    );

    // return createdBid;
    return { message: '즉시구매 완료' };
  }

  // 입찰 생성
  @Post('create')
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
    if (auction.sellerId === user.id) {
      throw new BadRequestException('판매자는 입찰할 수 없습니다.');
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

    // 입찰 생성 (이전 입찰자 정보 포함)
    const createdBid = await this.bidsService.createBid({
      auctionId: +auctionId,
      bidderId: user.id,
      amount: amount,
    });

    // 이전 입찰자가 있고, 새로운 입찰이 더 높으면 이전 입찰자의 잠금 해제
    const bidWithPrevious = createdBid as Bid & {
      previousBidderId?: number;
      previousAmount?: Prisma.Decimal;
    };
    if (bidWithPrevious.previousBidderId && bidWithPrevious.previousAmount) {
      await this.accountsService.decrementLockedAmount(
        bidWithPrevious.previousBidderId,
        bidWithPrevious.previousAmount.toNumber(),
      );
    }

    // 현재 사용자의 잔액 잠금 (currentAmount 감소, lockedAmount 증가)
    await this.accountsService.incrementLockedAmount(+user.id, amount);

    // 응답에서 내부 정보 제거
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { previousBidderId, previousAmount, ...responseBid } =
      bidWithPrevious;
    return responseBid;
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
