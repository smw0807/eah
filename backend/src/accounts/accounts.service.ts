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
    this.logger.log(
      `최초 계좌 생성: ${userId} - ${account.currentAmount.toString()}`,
    );
    return account;
  }

  // 계좌 조회
  async getAccount(userId: number) {
    const account = await this.prisma.userAccount.findUnique({
      where: { userId },
    });
    if (!account) {
      // 계좌가 없으면 최초 계좌 생성
      await this.createInitialAccount(userId);
      return this.getAccount(userId);
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

  // 계좌 잔액 조회
  async getAccountBalance(userId: number) {
    const account = await this.prisma.userAccount.findUnique({
      where: { userId },
    });
    return account?.currentAmount;
  }

  // 계좌 잔액 업데이트
  async updateAccountBalance(userId: number, amount: number) {
    const account = await this.prisma.userAccount.update({
      where: { userId },
      data: { currentAmount: amount },
    });
    return account;
  }

  // 계좌 락 잔액 조회
  async getAccountLockedBalance(userId: number) {
    const account = await this.prisma.userAccount.findUnique({
      where: { userId },
    });
    return account?.lockedAmount;
  }

  // 계좌 락 잔액 업데이트 (설정)
  async updateAccountLockedBalance(userId: number, amount: number) {
    const account = await this.prisma.userAccount.update({
      where: { userId },
      data: { lockedAmount: amount },
    });
    return account;
  }

  // lockedAmount 증가 및 currentAmount 감소 (입찰 시)
  async incrementLockedAmount(userId: number, amount: number) {
    const account = await this.prisma.userAccount.update({
      where: { userId },
      data: {
        lockedAmount: { increment: new Prisma.Decimal(amount) },
        currentAmount: { decrement: new Prisma.Decimal(amount) },
      },
    });
    return account;
  }

  // lockedAmount 감소 및 currentAmount 증가 (입찰 실패 시)
  async decrementLockedAmount(userId: number, amount: number) {
    const account = await this.prisma.userAccount.update({
      where: { userId },
      data: {
        lockedAmount: { decrement: new Prisma.Decimal(amount) },
        currentAmount: { increment: new Prisma.Decimal(amount) },
      },
    });
    return account;
  }
}
