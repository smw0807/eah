import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma/browser';
import { InputSignup } from 'src/users/input/input.signup';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private accessExpiredDate: number;
  private refreshExpiredDate: number;
  private readonly DAY_IN_MS = 1000 * 60 * 60 * 24;
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {
    this.accessExpiredDate =
      (this.configService.get('auth.accessExpiredDate') as number) *
      this.DAY_IN_MS;
    this.refreshExpiredDate =
      (this.configService.get('auth.refreshExpiredDate') as number) *
      this.DAY_IN_MS;
  }

  async signup(input: InputSignup): Promise<User> {
    const user = await this.usersService.createUser(input);
    return user;
  }

  generateToken(user: User) {
    const payload = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get('auth.jwtSecret'),
      expiresIn: this.accessExpiredDate,
    });
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get('auth.jwtSecret'),
      expiresIn: this.refreshExpiredDate,
    });
    this.logger.log('토큰 생성 성공');
    return { access_token, refresh_token };
  }

  verifyToken(token: string) {
    return this.jwtService.verify(token, {
      secret: this.configService.get('auth.jwtSecret'),
    });
  }
}
