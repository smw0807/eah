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
import { InputSignup } from 'src/users/input/input.signup';
import { AuthUtils } from 'src/utils/auth.utils';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly authUtils: AuthUtils,
  ) {}

  // 회원가입
  @Post('signup')
  async signup(
    @Body(new ValidationPipe()) input: InputSignup,
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.signup(input);
      this.logger.log(user, '회원가입 성공!');
      return res.status(201).json({ message: 'Signup successful' });
    } catch (error) {
      this.logger.error(error, 'signup');
      return res.status(400).json({ message: 'Signup failed' });
    }
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

      return res
        .status(200)
        .json({ message: 'Signin successful', access_token, refresh_token });
    } catch (error) {
      this.logger.error(error, 'signin');
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }

  @Post('verify-token')
  async verifyToken(
    @Headers('Authorization') authorization: string,
    @Res() res: Response,
  ) {
    try {
      const token = authorization.split(' ');
      if (!token) {
        throw new UnauthorizedException('Invalid token');
      }
      const tokenValue = token[1];
      if (!tokenValue) {
        throw new UnauthorizedException('Invalid token');
      }
      const decoded = await this.authService.verifyToken(tokenValue);
      return res.status(200).json({ message: 'Token verified', decoded });
    } catch (error) {
      this.logger.error(error, 'verifyToken');
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }
}
