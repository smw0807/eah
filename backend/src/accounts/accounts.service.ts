import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);
  constructor(private readonly prisma: PrismaService) {}

  // 최초 계좌 생성 (1억 지급)
  async createInitialAccount(userId: number) {
    const account = await this.prisma.userAccount.create({
      data: {
        userId,
        currentAmount: 100000000,
        lockedAmount: 0,
      },
    });
    return account;
  }

  // 계좌 조회
  async getAccount(userId: number) {
    const account = await this.prisma.userAccount.findUnique({
      where: { userId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  // 계좌 업데이트
  async updateAccount(userId: number, data: Prisma.UserAccountUpdateInput) {
    const account = await this.prisma.userAccount.update({
      where: { userId },
      data,
    });
    return account;
  }
}
