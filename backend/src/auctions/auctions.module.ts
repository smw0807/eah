import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { AuctionsGateway } from './auctions.gateway';
import { AuctionsScheduler } from './auctions.scheduler';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { AccountsModule } from 'src/accounts/accounts.module';
@Module({
  imports: [PrismaModule, AuthModule, AccountsModule],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionsGateway, AuctionsScheduler],
  exports: [AuctionsGateway, AuctionsService],
})
export class AuctionsModule {}
