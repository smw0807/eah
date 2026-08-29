import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma/browser';
import { InputSignup } from 'src/users/input/input.signup';
import { UsersService } from 'src/users/users.service';

type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  id: number;
  email: string;
  nickname: string;
  role: string;
  type: TokenType;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // jsonwebtoken 은 숫자 expiresIn 을 "초" 단위로 해석한다.
  private readonly accessExpiresInSec: number;
  private readonly refreshExpiresInSec: number;
  private readonly SECONDS_IN_DAY = 60 * 60 * 24;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {
    this.accessExpiresInSec =
      (Number(this.configService.get('auth.accessExpiredDate')) || 1) *
      this.SECONDS_IN_DAY;
    this.refreshExpiresInSec =
      (Number(this.configService.get('auth.refreshExpiredDate')) || 7) *
      this.SECONDS_IN_DAY;
  }

  async signup(input: InputSignup): Promise<User> {
    const user = await this.usersService.createUser(input);
    return user;
  }

  private get secret(): string {
    return this.configService.get('auth.jwtSecret') as string;
  }

  private sign(
    user: { id: number; email: string; nickname: string; role: string },
    type: TokenType,
    expiresIn: number,
  ): string {
    return this.jwtService.sign(
      {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        type,
      },
      { secret: this.secret, expiresIn },
    );
  }

  generateToken(user: User) {
    const access_token = this.sign(user, 'access', this.accessExpiresInSec);
    const refresh_token = this.sign(user, 'refresh', this.refreshExpiresInSec);
    this.logger.log(`토큰 생성 성공 (userId=${user.id})`);
    return { access_token, refresh_token };
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, { secret: this.secret });
  }

  /**
   * refresh 토큰으로 새 access 토큰을 발급한다.
   * refresh 타입이 아니면 거부.
   */
  refreshAccessToken(refreshToken: string): { access_token: string } {
    let payload: JwtPayload;
    try {
      payload = this.verifyToken(refreshToken);
    } catch {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('리프레시 토큰이 아닙니다.');
    }
    const access_token = this.sign(payload, 'access', this.accessExpiresInSec);
    return { access_token };
  }
}
