import { get, patch, post } from "@/lib/fetch";
import type {
  AuctionCreateInput,
  AuctionsResponse,
  AuctionUpdateInput,
  SearchAuctionsQuery,
} from "@/models/auction";

export const createAuction = async (auction: AuctionCreateInput) => {
  const response = await post(`/auctions`, auction);
  return response.json();
};

export const getAuctions = async ({
  category,
  sort,
  search,
  minPrice,
  maxPrice,
  status,
  page = 1,
  limit = 20,
}: SearchAuctionsQuery): Promise<AuctionsResponse> => {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);
  if (search) params.set("search", search);
  if (minPrice) params.set("minPrice", String(minPrice));
  if (maxPrice) params.set("maxPrice", String(maxPrice));
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const response = await get(`/auctions?${params.toString()}`);
  return response.json();
};

export const isCurrentAuction = async (auctionId: number) => {
  const response = await get(`/auctions/current?auctionId=${auctionId}`);
  return response.json();
};

export const getAuctionDetail = async (auctionId: number) => {
  const response = await get(`/auctions/${auctionId}`);
  return response.json();
};

export const updateAuction = async (
  auctionId: number,
  updateAuction: AuctionUpdateInput,
) => {
  const response = await patch(`/auctions/${auctionId}`, updateAuction);
  return response.json();
};

export const cancelAuction = async (auctionId: number) => {
  const response = await patch(`/auctions/${auctionId}/cancel`, null);
  return response.json();
};
