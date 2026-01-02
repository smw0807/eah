import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule } from 'src/config/config.module';
import { JwtModule } from '@nestjs/jwt';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [UsersModule, ConfigModule, JwtModule, UtilsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
