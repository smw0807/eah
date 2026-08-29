import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();

      const token = request.headers['authorization'] as string;

      if (!token) {
        throw new UnauthorizedException('Invalid token');
      }
      const parts = token.trim().split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
        throw new UnauthorizedException('Invalid token format');
      }
      const tokenValue = parts[1];

      const decoded = this.authService.verifyToken(tokenValue);
      if (!decoded) {
        throw new UnauthorizedException('Invalid token');
      }
      request['user'] = decoded;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(`AuthGuard 인증 실패: ${(error as Error)?.name}`);
      // 만료 토큰은 프론트가 재로그인 유도할 수 있도록 구분
      if ((error as Error)?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
