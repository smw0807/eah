import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('supabase.url') as string,
      this.configService.get('supabase.key') as string,
    );
  }

  getClient() {
    return this.supabase;
  }
}
