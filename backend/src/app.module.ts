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
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(), // 스케줄러 모듈 등록
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1분 window
        limit: 60,  // 분당 60회
      },
      {
        name: 'strict',
        ttl: 60000, // 1분 window
        limit: 10,  // 입찰 등 민감 엔드포인트: 분당 10회
      },
    ]),
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // 전역 레이트 리미팅
    },
  ],
})
export class AppModule {}
