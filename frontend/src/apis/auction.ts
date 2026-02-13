import { get, patch, post } from "@/lib/fetch";
import type { AuctionCreateInput, SearchAuctionsQuery } from "@/models/auction";

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
}: SearchAuctionsQuery) => {
  const response = await get(
    `/auctions?category=${category}&sort=${sort}&search=${search}&minPrice=${minPrice}&maxPrice=${maxPrice}&status=${status}`,
  );
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

export const cancelAuction = async (auctionId: number) => {
  const response = await patch(`/auctions/${auctionId}/cancel`, null);
  return response.json();
};
