import { registerAs } from '@nestjs/config';
export default registerAs('app', () => ({
  appFullName: process.env.APP_FULL_NAME,
  appName: process.env.APP_NAME,
  appPort: process.env.APP_PORT,
  logLevel: process.env.LOG_LEVEL,
}));
