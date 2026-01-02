import {
  Body,
  Controller,
  Headers,
  Logger,
  Post,
  Res,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { InputSignup } from 'src/users/input/input.signup';
import { AuthUtils } from 'src/utils/auth.utils';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private accessExpiredDate: number;
  private refreshExpiredDate: number;
  private readonly DAY_IN_MS = 1000 * 60 * 60 * 24;
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly authUtils: AuthUtils,
  ) {
    this.accessExpiredDate =
      (this.configService.get('auth.accessExpiredDate') as number) *
      this.DAY_IN_MS;
    this.refreshExpiredDate =
      (this.configService.get('auth.refreshExpiredDate') as number) *
      this.DAY_IN_MS;
  }

  // 회원가입
  @Post('signup')
  async signup(@Body(new ValidationPipe()) input: InputSignup) {
    return this.authService.signup(input);
  }

  @Post('signin')
  async signin(
    @Headers('Authorization') authorization: string,
    @Res() res: Response,
  ) {
    try {
      const token = authorization.split(' ');
      if (token.length !== 2) {
        throw new UnauthorizedException('Invalid token');
      }
      const tokenValue = token[1];
      const decoded = Buffer.from(tokenValue, 'base64').toString('utf-8');

      const [email, password] = decoded.split(':');

      const user = await this.usersService.getUser('email', email);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }
      const isPasswordValid = await this.authUtils.comparePassword(
        password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }
      const { access_token, refresh_token } =
        this.authService.generateToken(user);
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      return res.status(200).json({ message: 'Signin successful' });
    } catch (error) {
      this.logger.error(error, 'signin');
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }
}
