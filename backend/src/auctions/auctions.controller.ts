import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { AuctionCreateInput } from 'generated/prisma/models';
import { CurrentUser } from 'src/auth/decorator/current.user';
import { User } from 'generated/prisma/client';

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getAuctions(
    @Query('orderBy')
    orderBy:
      | 'createdAt'
      | 'updatedAt'
      | 'title'
      | 'price'
      | 'status'
      | 'startDate'
      | 'endDate',
    @Query('orderDirection') orderDirection: 'asc' | 'desc',
  ) {
    return this.auctionsService.getAuctions(orderBy, orderDirection);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createAuction(
    @Body()
    auction: AuctionCreateInput & { categoryId: number; subCategoryId: number },
    @CurrentUser() user: User,
  ) {
    return this.auctionsService.createAuction(auction, user.id);
  }
}
