import { forwardRef, Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { AuctionsGateway } from './auctions.gateway';
import { AuctionsScheduler } from './auctions.scheduler';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { AccountsModule } from 'src/accounts/accounts.module';
import { BidsModule } from 'src/bids/bids.module';
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AccountsModule,
    forwardRef(() => BidsModule),
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionsGateway, AuctionsScheduler],
  exports: [AuctionsGateway, AuctionsService],
})
export class AuctionsModule {}
