import { post } from "@/lib/fetch";
import type { AuctionCreateInput } from "@/models/auction";

export const createAuction = async (auction: AuctionCreateInput) => {
  const response = await post(`/auctions`, auction);
  return response.json();
};
