import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InputSignup } from './input/input.signup';
import { AuthUtils } from 'src/utils/auth.utils';
import { User } from 'generated/prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly authUtils: AuthUtils,
  ) {}
  // 회원가입
  async signup(input: InputSignup): Promise<User> {
    this.logger.log(input, 'signup');
    const { name, nickname, email, password } = input;
    // 닉네임 중복 체크
    const isNicknameExists = await this.checkNickname(nickname);
    if (isNicknameExists) {
      throw new BadRequestException('닉네임이 이미 존재합니다.');
    }
    // 이메일 중복 체크
    const isEmailExists = await this.checkEmail(email);
    if (isEmailExists) {
      throw new BadRequestException('이메일이 이미 존재합니다.');
    }
    // 비밀번호 해싱
    const hashedPassword = await this.authUtils.hashPassword(password);
    // 회원 생성
    const user = await this.prisma.user.create({
      data: {
        name,
        nickname,
        email,
        passwordHash: hashedPassword,
      },
    });
    this.logger.log('회원가입 성공');
    return user;
  }
  // 회원정보 조회
  // 회원정보 수정
  // 회원탈퇴
  // 비밀번호 변경

  // 닉네임 중복 체크
  async checkNickname(nickname: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: {
        nickname,
      },
    });
    return !!user;
  }
  // 이메일 중복 체크
  async checkEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    return !!user;
  }
}
