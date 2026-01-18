export const AuctionStatus = {
  SCHEDULED: "SCHEDULED",
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  CANCELED: "CANCELED",
} as const;

export type AuctionStatus = (typeof AuctionStatus)[keyof typeof AuctionStatus];

export type AuctionCreateInput = {
  title: string;
  description?: string | null;
  status: AuctionStatus;
  startPrice: number | string;
  minBidStep?: number | string;
  currentPrice?: number | string | null;
  buyoutPrice?: number | string | null;
  categoryId: number;
  subCategoryId: number;
  imageUrl?: string | null;
  startAt: Date | string;
  endAt: Date | string;
};
