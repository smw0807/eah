import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpException,
  Logger,
  NotFoundException,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';
import { InputSignup } from 'src/users/input/input.signup';
import { AuthUtils } from 'src/utils/auth.utils';

/**
 * `Scheme <value>` 형태의 Authorization 헤더에서 값 부분을 안전하게 추출한다.
 * 헤더가 없거나 형식이 잘못되면 401.
 */
function parseAuthorizationHeader(
  authorization: string | undefined,
  scheme: 'Basic' | 'Bearer',
): string {
  if (!authorization || typeof authorization !== 'string') {
    throw new UnauthorizedException('인증 정보가 없습니다.');
  }
  const [headerScheme, value, ...rest] = authorization.trim().split(/\s+/);
  if (rest.length > 0 || headerScheme !== scheme || !value) {
    throw new UnauthorizedException('인증 정보 형식이 올바르지 않습니다.');
  }
  return value;
}

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
  @Throttle({ strict: { ttl: 60000, limit: 10 } })
  async signup(@Body() input: InputSignup, @Res() res: Response) {
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
      this.logger.log(`회원가입 성공! userId=${user.id}, email=${user.email}`);
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
  @Throttle({ strict: { ttl: 60000, limit: 10 } })
  async signin(
    @Headers('Authorization') authorization: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const tokenValue = parseAuthorizationHeader(authorization, 'Basic');
      const decoded = Buffer.from(tokenValue, 'base64').toString('utf-8');

      const sep = decoded.indexOf(':');
      if (sep < 0) {
        throw new UnauthorizedException('인증 정보 형식이 올바르지 않습니다.');
      }
      const email = decoded.slice(0, sep);
      const password = decoded.slice(sep + 1);

      const user = await this.usersService.getUser('email', email);
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
      // 존재하지 않는 이메일도 자격 증명 오류로 통일 (계정 존재 여부 노출 방지)
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 일치하지 않습니다.',
        );
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      return res
        .status(500)
        .json({ message: '로그인 실패', statusCode: 500 });
    }
  }

  // 리프레시 토큰으로 access 토큰 재발급
  @Post('refresh')
  @Throttle({ strict: { ttl: 60000, limit: 30 } })
  refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('리프레시 토큰이 없습니다.');
    }
    return this.authService.refreshAccessToken(refreshToken);
  }

  @Post('verify-token')
  async verifyToken(
    @Headers('Authorization') authorization: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const tokenValue = parseAuthorizationHeader(authorization, 'Bearer');
      const decoded = this.authService.verifyToken(tokenValue);
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
