import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * 경매 수정 DTO.
 * 판매자가 임의로 status / currentPrice / winningBidId / sellerId 등을
 * 주입하지 못하도록 수정 가능한 필드만 화이트리스트로 노출한다.
 * (전역 ValidationPipe: whitelist + forbidNonWhitelisted)
 */
export class UpdateAuctionDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '상품명을 입력해주세요.' })
  @MaxLength(50, { message: '상품명은 최대 50자까지 입력할 수 있습니다.' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: '상품설명은 최대 1000자까지 입력할 수 있습니다.' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: '시작가격은 숫자여야 합니다.' })
  @IsPositive({ message: '시작가격은 0보다 커야 합니다.' })
  startPrice?: number;

  @IsOptional()
  @IsNumber({}, { message: '입찰 단위는 숫자여야 합니다.' })
  @IsPositive({ message: '입찰 단위는 0보다 커야 합니다.' })
  minBidStep?: number;

  @IsOptional()
  @IsNumber({}, { message: '즉시구매가는 숫자여야 합니다.' })
  @IsPositive({ message: '즉시구매가는 0보다 커야 합니다.' })
  buyoutPrice?: number;

  @IsOptional()
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: '이미지 URL은 https 주소여야 합니다.' },
  )
  imageUrl?: string | null;

  @IsOptional()
  @IsDateString({}, { message: '시작일시 형식이 올바르지 않습니다.' })
  startAt?: string;

  @IsOptional()
  @IsDateString({}, { message: '종료일시 형식이 올바르지 않습니다.' })
  endAt?: string;
}
