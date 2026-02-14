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
  startPrice: number | string;
  minBidStep?: number | string;
  buyoutPrice?: number | string | null;
  categoryId: number;
  subCategoryId: number;
  imageUrl?: string | null;
  startAt: Date | string;
  endAt: Date | string;
};

export type Image = { file: File; previewUrl: string };

export type SearchAuctionsQuery = {
  sort?: string;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
};

export type Auction = {
  id: number;
  sellerId: number;
  title: string;
  description: string;
  status: AuctionStatus;
  startPrice: string;
  minBidStep: string;
  currentPrice: string | null;
  buyoutPrice: string | null;
  categoryId: number;
  subCategoryId: number;
  imageUrl: string | null;
  startAt: string;
  endAt: string;
  winningBidId: number | null;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: number;
    name: string;
    nickname: string;
    email: string;
  };
  category: {
    id: number;
    code: string;
    name: string;
    parentId: number | null;
  };
  subCategory: {
    id: number;
    code: string;
    name: string;
    parentId: number | null;
  };
  bids: Bid[];
};

export type Bid = {
  id: number;
  auctionId: number;
  bidderId: number;
  amount: number;
};

export type AuctionUpdateInput = {
  title?: string;
  description?: string | null;
  status?: AuctionStatus;
  startPrice?: number | string;
  minBidStep?: number | string;
  currentPrice?: number | string | null;
  buyoutPrice?: number | string | null;
  imageUrl?: string | null;
  startAt?: Date | string;
  endAt?: Date | string;
};
