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
      console.log(token);

      if (!token) {
        throw new UnauthorizedException('Invalid token');
      }
      const tokenValue = token.split(' ')[1];
      const decoded = await this.authService.verifyToken(tokenValue);
      if (!decoded) {
        throw new UnauthorizedException('Invalid token');
      }
      request['user'] = decoded;
      return true;
    } catch (error) {
      this.logger.error(error, 'AuthGuard');
      throw new UnauthorizedException('Invalid token');
    }
  }
}
