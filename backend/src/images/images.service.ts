import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  private readonly BUCKET_NAME = 'auctions';

  constructor(private readonly supabaseService: SupabaseService) {
    // 서비스 초기화 시 버킷 존재 여부 확인 (비동기이므로 void로 처리)
    void this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    const supabase = this.supabaseService.getClient();
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      this.logger.error(`버킷 목록 조회 실패: ${error.message}`);
      return;
    }

    const bucketExists = buckets?.some(
      (bucket) => bucket.name === this.BUCKET_NAME,
    );

    if (!bucketExists) {
      this.logger.warn(
        `버킷 '${this.BUCKET_NAME}'이 존재하지 않습니다. Supabase 대시보드에서 버킷을 생성하고 public으로 설정해주세요.`,
      );
    } else {
      this.logger.log(`버킷 '${this.BUCKET_NAME}' 확인 완료`);
    }
  }

  async uploadImage(file: Express.Multer.File, userId: number) {
    // 파일 존재 여부 확인
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('업로드할 파일이 없습니다.');
    }

    // 파일 크기 검증 (최대 10MB)
    if (file.buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `파일 크기는 최대 ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB까지 허용됩니다.`,
      );
    }

    // MIME 타입 검증
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `허용되지 않는 파일 형식입니다. 허용 형식: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    const fileExtension = file.originalname.split('.').pop() || 'webp';
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    const supabase = this.supabaseService.getClient();

    // 버킷 존재 여부 확인
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(
      (bucket) => bucket.name === this.BUCKET_NAME,
    );

    if (!bucketExists) {
      throw new InternalServerErrorException(
        `버킷 '${this.BUCKET_NAME}'이 존재하지 않습니다. Supabase 대시보드에서 버킷을 생성하고 public으로 설정해주세요.`,
      );
    }

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, file.buffer as Uint8Array, {
        upsert: false, // 중복 시 에러 발생
      });

    if (error) {
      this.logger.error(`이미지 업로드 실패: ${error.message}`, error);
      throw new InternalServerErrorException(
        `이미지 업로드 실패: ${error.message}`,
      );
    }

    // 업로드 성공 시 data.path에 실제 업로드된 경로가 들어있음
    if (!data?.path) {
      throw new InternalServerErrorException(
        '파일 업로드 후 경로를 받지 못했습니다.',
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(data.path);

    this.logger.log(`이미지 업로드 성공: ${publicUrl}`);

    return {
      url: publicUrl,
    };
  }
}
