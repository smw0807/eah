import { IsInt, IsPositive, Max, Min } from 'class-validator';

export class CreateBidDto {
  @IsInt({ message: '경매 ID가 올바르지 않습니다.' })
  @IsPositive({ message: '경매 ID가 올바르지 않습니다.' })
  auctionId: number;

  @IsInt({ message: '입찰 금액은 정수여야 합니다.' })
  @Min(100, { message: '입찰 금액은 100원 이상이어야 합니다.' })
  @Max(1_000_000_000, { message: '입찰 금액은 10억원을 초과할 수 없습니다.' })
  amount: number;
}

export class CreateBuyoutDto {
  @IsInt({ message: '경매 ID가 올바르지 않습니다.' })
  @IsPositive({ message: '경매 ID가 올바르지 않습니다.' })
  auctionId: number;
}
