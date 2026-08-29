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
import { Role, User } from 'generated/prisma/client';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { RBAC } from 'src/auth/decorator/rbac';
import { CreateBidDto, CreateBuyoutDto } from './dto/create-bid.dto';

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  // 전체 입찰 내역 조회 (관리자 전용)
  @Get()
  @UseGuards(AuthGuard, RoleGuard)
  @RBAC(Role.ADMIN)
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
    @Body() body: CreateBuyoutDto,
  ) {
    // 상태/잔액/판매자 검증과 잔액 처리는 서비스 트랜잭션 내부에서 원자적으로 수행
    await this.bidsService.createBuyout(body.auctionId, user.id);
    return { message: '즉시구매 완료' };
  }

  // 입찰 생성
  @Post('create')
  @Throttle({ strict: { ttl: 60000, limit: 10 } })
  @UseGuards(AuthGuard)
  async createBid(@Body() body: CreateBidDto, @CurrentUser() user: User) {
    if (body.amount % 100 !== 0) {
      throw new BadRequestException('입찰 금액은 100원 단위로 입력해주세요.');
    }

    // 경매 상태/현재가/최소 단위/최고 입찰자/잔액 검증은
    // 서비스 트랜잭션 내부에서 경매 행 잠금과 함께 원자적으로 수행
    return this.bidsService.createBid({
      auctionId: body.auctionId,
      bidderId: user.id,
      amount: body.amount,
    });
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
