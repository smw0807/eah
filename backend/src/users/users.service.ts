import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InputSignup } from './input/input.signup';
import { AuthUtils } from 'src/utils/auth.utils';
import { User } from 'generated/prisma/client';
import { UserWhereUniqueInput } from 'generated/prisma/models';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly authUtils: AuthUtils,
  ) { }

  // 회원정보 조회
  async getMyProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
  // 회원정보 수정
  async updateMyProfile(userId: number, updateUser: InputSignup) {
    const { name, nickname, email, password } = updateUser;

    const updateParams = {
      name,
      nickname,
      email,
      updatedAt: new Date(),
    }
    if (password) {
      updateParams['passwordHash'] = await this.authUtils.hashPassword(password) as string;
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateParams,
    });
    return user;
  }
  // 회원탈퇴
  // 비밀번호 변경

  // 사용자 조회
  async getUser(
    type: 'id' | 'nickname' | 'email',
    value: string,
  ): Promise<User> {
    const where: UserWhereUniqueInput = {
      id: undefined,
      nickname: undefined,
      email: undefined,
    };
    if (type === 'id') {
      where.id = parseInt(value);
    } else if (type === 'nickname') {
      where.nickname = value;
    } else if (type === 'email') {
      where.email = value;
    }
    const user = await this.prisma.user.findUnique({
      where,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // 사용자 생성
  async createUser(input: InputSignup): Promise<User> {
    const { name, nickname, email, password } = input;
    const hashedPassword = await this.authUtils.hashPassword(password);
    const user = await this.prisma.user.create({
      data: {
        name,
        nickname,
        email,
        passwordHash: hashedPassword,
      },
    });
    return user;
  }

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
