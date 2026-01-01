import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { InputSignup } from './input/input.signup';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 회원가입
  @Post('signup')
  async signup(@Body(new ValidationPipe()) input: InputSignup) {
    return this.usersService.signup(input);
  }
}
