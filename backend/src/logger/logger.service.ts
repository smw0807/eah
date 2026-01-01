import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';

export const LoggerService = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL,
      format: winston.format.combine(
        winston.format.timestamp(),
        utilities.format.nestLike(process.env.APP_NAME),
      ),
    }),
  ],
});
