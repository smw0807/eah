/**
 * Prisma 조회 시 관계 필드를 `include: { relation: true }`로 노출하면
 * 해당 모델의 모든 스칼라 필드(User.passwordHash 등)가 응답에 포함된다.
 * 외부로 나가는 응답에는 반드시 아래 select 화이트리스트를 사용한다.
 */

// 사용자 공개 정보 (입찰자/판매자 표시용)
export const PUBLIC_USER_SELECT = {
  id: true,
  nickname: true,
} as const;

// 입찰 공개 정보
export const PUBLIC_BID_SELECT = {
  id: true,
  auctionId: true,
  bidderId: true,
  amount: true,
  createdAt: true,
  bidder: { select: PUBLIC_USER_SELECT },
} as const;
