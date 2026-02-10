import { Module, forwardRef } from '@nestjs/common';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { AuctionsModule } from 'src/auctions/auctions.module';
import { AccountsModule } from 'src/accounts/accounts.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    forwardRef(() => AuctionsModule),
    forwardRef(() => AccountsModule),
  ],
  controllers: [BidsController],
  providers: [BidsService],
  exports: [BidsService],
})
export class BidsModule {}
