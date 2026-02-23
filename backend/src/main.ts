import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger/logger.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useLogger(LoggerService);

  app.setGlobalPrefix('api');

  // 전역 입력값 검증 파이프 - class-validator 데코레이터 활성화
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // DTO에 없는 필드 자동 제거
      forbidNonWhitelisted: true, // DTO에 없는 필드 요청 시 400 에러
      transform: true,        // 쿼리 파라미터 등 타입 자동 변환
    }),
  );

  const configService = app.get(ConfigService);

  const corsConfig = configService.get('cors') as {
    origin: string;
    methods: string;
    allowedHeaders: string;
  };

  app.enableCors({
    origin: corsConfig.origin,
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.allowedHeaders,
  });

  const appConfig = configService.get('app') as {
    appFullName: string;
    appName: string;
    appPort: number;
  };

  LoggerService.log(
    `${appConfig.appFullName} (${appConfig.appName}) is running on port ${appConfig.appPort}`,
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
