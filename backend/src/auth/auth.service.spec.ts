import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';

const TEST_SECRET = 'test-secret-value-at-least-32-characters-long';

const configValues: Record<string, unknown> = {
  'auth.jwtSecret': TEST_SECRET,
  'auth.accessExpiredDate': 1,
  'auth.refreshExpiredDate': 7,
};

const user = {
  id: 42,
  name: '홍길동',
  nickname: 'gildong',
  email: 'gildong@example.com',
  role: 'USER',
} as never;

describe('AuthService', () => {
  let service: AuthService;
  let jwt: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: TEST_SECRET })],
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => configValues[key] },
        },
        { provide: UsersService, useValue: { createUser: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
    jwt = module.get(JwtService);
  });

  it('access/refresh 토큰에 type 클레임을 넣는다', () => {
    const { access_token, refresh_token } = service.generateToken(user);
    expect(jwt.decode(access_token)).toMatchObject({ id: 42, type: 'access' });
    expect(jwt.decode(refresh_token)).toMatchObject({ type: 'refresh' });
  });

  it('access 토큰 만료 시간은 초 단위(1일 = 86400s)로 설정된다', () => {
    const { access_token } = service.generateToken(user);
    const decoded = jwt.decode(access_token) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(86400);
  });

  it('refreshAccessToken: refresh 토큰으로 새 access 토큰을 발급한다', () => {
    const { refresh_token } = service.generateToken(user);
    const { access_token } = service.refreshAccessToken(refresh_token);
    expect(jwt.decode(access_token)).toMatchObject({ id: 42, type: 'access' });
  });

  it('refreshAccessToken: access 토큰을 넣으면 거부한다', () => {
    const { access_token } = service.generateToken(user);
    expect(() => service.refreshAccessToken(access_token)).toThrow(
      UnauthorizedException,
    );
  });

  it('refreshAccessToken: 위조 토큰은 거부한다', () => {
    expect(() => service.refreshAccessToken('not-a-jwt')).toThrow(
      UnauthorizedException,
    );
  });
});
