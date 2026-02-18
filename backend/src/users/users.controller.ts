import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { CurrentUser } from 'src/auth/decorator/current.user';
import { User } from 'generated/prisma/client';
import { InputSignup } from './input/input.signup';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // 내 프로필 조회
  @Get('me')
  @UseGuards(AuthGuard)
  async getMyProfile(@CurrentUser() user: User) {
    return this.usersService.getMyProfile(+user.id);
  }

  // 프로필 수정
  @Patch('me')
  @UseGuards(AuthGuard)
  async updateMyProfile(@CurrentUser() user: User, @Body() updateUser: InputSignup) {
    return this.usersService.updateMyProfile(+user.id, updateUser);
  }
}
