import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name, { timestamp: true });

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    const adapter = new PrismaPg({
      connectionString: configService.get('db.url') as string,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected');
  }
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }
}
