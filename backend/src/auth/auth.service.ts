import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma/browser';
import { InputSignup } from 'src/users/input/input.signup';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async signup(input: InputSignup): Promise<User> {
    this.logger.log(input, 'signup');
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
    const user = await this.usersService.createUser(input);
    this.logger.log('회원가입 성공');
    return user;
  }

  generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
    };
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get('auth.jwtSecret'),
      expiresIn: this.configService.get('auth.accessExpiredDate'),
    });
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get('auth.jwtSecret'),
      expiresIn: this.configService.get('auth.refreshExpiredDate'),
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
