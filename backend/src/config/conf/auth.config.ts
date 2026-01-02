import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  bcryptSalt: process.env.BCRYPT_SALT,
  jwtSecret: process.env.JWT_SECRET,
  accessExpiredDate: process.env.ACCESS_EXPIRED_DATE,
  refreshExpiredDate: process.env.REFRESH_EXPIRED_DATE,
}));
