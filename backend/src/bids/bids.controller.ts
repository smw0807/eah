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
import { Role, User } from 'generated/prisma/client';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { RBAC } from 'src/auth/decorator/rbac';

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

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

  // 사용자 입찰 내역 조회
  @Get('user/:userId')
  @UseGuards(AuthGuard, RoleGuard)
  @RBAC(Role.ADMIN)
  async getUserBidsById(@Param('userId') userId: number) {
    return this.bidsService.getUserBidsById(userId);
  }

  // 경매 입찰 내역 조회
  @Get('auction/:auctionId')
  @UseGuards(AuthGuard)
  async getAuctionBids(@Param('auctionId') auctionId: number) {
    return this.bidsService.getAuctionBids(auctionId);
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

    return this.bidsService.createBid({
      auctionId,
      bidderId: user.id,
      amount,
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
  @Delete('delete')
  @RBAC(Role.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  async deleteBid(@Body() body: { id: number }) {
    const { id } = body;
    if (!id) {
      throw new BadRequestException('Invalid request body');
    }
    return this.bidsService.deleteBid(id);
  }
}
