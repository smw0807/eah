import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import appConfig from './conf/app.config';
import authConfig from './conf/auth.config';
import corsConfig from './conf/cors.config';
import dbConfig from './conf/db.config';

import { validationSchema } from './validation.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: '.env',
      load: [appConfig, authConfig, corsConfig, dbConfig],
      isGlobal: true,
      validationSchema: validationSchema,
    }),
  ],
})
export class ConfigModule {}
