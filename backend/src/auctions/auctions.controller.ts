import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { AuctionCreateInput } from 'generated/prisma/models';
import { CurrentUser } from 'src/auth/decorator/current.user';
import { User } from 'generated/prisma/client';
import { SearchAuctionsQuery } from './models/search.model';

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getAuctions(
    @Query('orderBy')
    orderBy: SearchAuctionsQuery['orderBy'],
    @Query('orderDirection')
    orderDirection: SearchAuctionsQuery['orderDirection'],
  ) {
    if (!orderBy || !orderDirection) {
      throw new BadRequestException('orderBy and orderDirection are required');
    }
    return this.auctionsService.getAuctions(orderBy, orderDirection);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createAuction(
    @Body()
    auction: AuctionCreateInput & { categoryId: number; subCategoryId: number },
    @CurrentUser() user: User,
  ) {
    if (!auction.categoryId || !auction.subCategoryId) {
      throw new BadRequestException(
        'categoryId and subCategoryId are required',
      );
    }
    if (
      typeof auction.categoryId !== 'number' ||
      typeof auction.subCategoryId !== 'number'
    ) {
      throw new BadRequestException(
        'categoryId and subCategoryId must be numbers',
      );
    }
    if (auction.categoryId <= 0 || auction.subCategoryId <= 0) {
      throw new BadRequestException(
        'categoryId and subCategoryId must be positive',
      );
    }
    if (auction.startAt >= auction.endAt) {
      throw new BadRequestException('startAt must be before endAt');
    }

    if (auction.imageUrl && !auction.imageUrl.startsWith('https://')) {
      throw new BadRequestException('imageUrl must be a valid URL');
    }
    return this.auctionsService.createAuction(auction, user.id);
  }
}
