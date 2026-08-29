import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAuctionDto {
  @IsString()
  @MinLength(1, { message: '상품명을 입력해주세요.' })
  @MaxLength(50, { message: '상품명은 최대 50자까지 입력할 수 있습니다.' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: '상품설명은 최대 1000자까지 입력할 수 있습니다.' })
  description?: string;

  @IsNumber({}, { message: '시작가격은 숫자여야 합니다.' })
  @IsPositive({ message: '시작가격은 0보다 커야 합니다.' })
  startPrice: number;

  @IsNumber({}, { message: '입찰 단위는 숫자여야 합니다.' })
  @IsPositive({ message: '입찰 단위는 0보다 커야 합니다.' })
  minBidStep: number;

  @IsOptional()
  @IsNumber({}, { message: '즉시구매가는 숫자여야 합니다.' })
  @IsPositive({ message: '즉시구매가는 0보다 커야 합니다.' })
  buyoutPrice?: number;

  @Type(() => Number)
  @IsInt({ message: '카테고리를 선택해주세요.' })
  @IsPositive({ message: '카테고리를 선택해주세요.' })
  categoryId: number;

  @Type(() => Number)
  @IsInt({ message: '서브카테고리를 선택해주세요.' })
  @IsPositive({ message: '서브카테고리를 선택해주세요.' })
  subCategoryId: number;

  @IsOptional()
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: '이미지 URL은 https 주소여야 합니다.' },
  )
  imageUrl?: string | null;

  @IsDateString({}, { message: '시작일시 형식이 올바르지 않습니다.' })
  startAt: string;

  @IsDateString({}, { message: '종료일시 형식이 올바르지 않습니다.' })
  endAt: string;
}
