import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { UtilsModule } from './utils/utils.module';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [ConfigModule, UsersModule, PrismaModule, UtilsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
