import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class ImagesService {
  private readonly BUCKET_NAME = 'auctions';
  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadImage(file: Express.Multer.File, userId: number) {
    const fileExtension = file.originalname.split('.').pop() || 'webp';
    const filePath = `${userId}/${new Date().getTime()}-${crypto.randomUUID()}.${fileExtension}`;
    console.log(filePath);

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, file.buffer as Uint8Array);

    if (error) {
      throw new InternalServerErrorException(`이미지 업로드 실패: ${error}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(data.path);
    return publicUrl;
  }
}
