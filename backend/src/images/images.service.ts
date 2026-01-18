import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class ImagesService {
  private readonly BUCKET_NAME = 'auctions';
  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadImage(file: File, filePath: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, file);
    if (error) throw error;
    const {
      data: { publicUrl },
    } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(data.path);
    return publicUrl;
  }
}
