import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { UtilsModule } from './utils/utils.module';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { CategoryModule } from './category/category.module';
import { BidsModule } from './bids/bids.module';
import { AuctionsModule } from './auctions/auctions.module';
import { ImagesModule } from './images/images.module';
import { SupabaseModule } from './supabase/supabase.module';
import { BidModule } from './bid/bid.module';
@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PrismaModule,
    UtilsModule,
    AuthModule,
    AccountsModule,
    CategoryModule,
    BidsModule,
    AuctionsModule,
    ImagesModule,
    SupabaseModule,
    BidModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
