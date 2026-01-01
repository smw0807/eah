import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthUtils {
  private readonly saltRounds = 10;
  private readonly authConfig;
  constructor(private readonly configService: ConfigService) {
    this.authConfig = configService.get('auth');
  }

  /**
   * 비밀번호 해싱
   * @param password
   * @returns
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(
      password + this.authConfig.bcryptSalt,
      this.saltRounds,
    );
  }

  /**
   * 비밀번호 비교
   * @param password
   * @param hashedPassword
   * @returns
   */
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(
      password + this.authConfig.bcryptSalt,
      hashedPassword,
    );
  }
}
