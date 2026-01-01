import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useLogger(LoggerService);

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
