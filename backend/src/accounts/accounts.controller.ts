import { Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { CurrentUser } from 'src/auth/decorator/current.user';
import { User } from 'generated/prisma/client';
import { Response } from 'express';

@Controller('accounts')
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);
  constructor(private readonly accountsService: AccountsService) {}

  // 최초 계좌 생성
  @Post('create')
  @UseGuards(AuthGuard)
  async createAccount(@CurrentUser() user: User) {
    return this.accountsService.createInitialAccount(user.id);
  }

  // 계좌 조회
  @Get('get')
  @UseGuards(AuthGuard)
  async getAccount(@CurrentUser() user: User) {
    return this.accountsService.getAccount(user.id);
  }
}
