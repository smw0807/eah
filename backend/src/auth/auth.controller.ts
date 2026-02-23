import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpException,
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
  ) { }

  // 회원가입
  @Post('signup')
  async signup(
    @Body(new ValidationPipe()) input: InputSignup,
    @Res() res: Response,
  ) {
    try {
      const { nickname, email } = input;
      // 닉네임 중복 체크
      const isNicknameExists = await this.usersService.checkNickname(nickname);
      if (isNicknameExists) {
        throw new BadRequestException('닉네임이 이미 존재합니다.');
      }
      // 이메일 중복 체크
      const isEmailExists = await this.usersService.checkEmail(email);
      if (isEmailExists) {
        throw new BadRequestException('이메일이 이미 존재합니다.');
      }
      const user = await this.authService.signup(input);
      this.logger.log(user, '회원가입 성공!');
      return res
        .status(201)
        .json({ message: '회원가입 성공', statusCode: 201 });
    } catch (error) {
      this.logger.error(error, 'signup');
      // BadRequestException 등 HTTP 예외는 그대로 전파
      if (error instanceof HttpException) {
        throw error;
      }
      return res
        .status(500)
        .json({ message: '회원가입 실패', statusCode: 500 });
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
        throw new UnauthorizedException('토큰이 유효하지 않습니다.');
      }
      const tokenValue = token[1];
      const decoded = Buffer.from(tokenValue, 'base64').toString('utf-8');

      const [email, password] = decoded.split(':');

      const user = await this.usersService.getUser('email', email);
      if (!user) {
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 일치하지 않습니다.',
        );
      }
      const isPasswordValid = await this.authUtils.comparePassword(
        password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 일치하지 않습니다.',
        );
      }
      const { access_token, refresh_token } =
        this.authService.generateToken(user);

      return res.status(200).json({
        message: '로그인 성공',
        statusCode: 200,
        access_token,
        refresh_token,
      });
    } catch (error) {
      this.logger.error(error, 'signin');
      if (error.status === 401) {
        throw new UnauthorizedException(error.message);
      }
      return res
        .status(500)
        .json({ message: '로그인 실패', statusCode: 500 });
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
        throw new UnauthorizedException('토큰이 유효하지 않습니다.');
      }
      const tokenValue = token[1];
      if (!tokenValue) {
        throw new UnauthorizedException('토큰이 유효하지 않습니다.');
      }
      const decoded = await this.authService.verifyToken(tokenValue);
      return res
        .status(200)
        .json({ message: '토큰 검증 성공', statusCode: 200, decoded });
    } catch (error) {
      this.logger.error(error, 'verifyToken');
      return res
        .status(401)
        .json({ message: '토큰 검증 실패', statusCode: 401 });
    }
  }
}
