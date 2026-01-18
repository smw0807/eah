import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabaseController } from './supabase.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [SupabaseController],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
