import { get, post } from "@/lib/fetch";
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
}: SearchAuctionsQuery) => {
  const response = await get(
    `/auctions?category=${category}&sort=${sort}&search=${search}&minPrice=${minPrice}&maxPrice=${maxPrice}`,
  );
  return response.json();
};
