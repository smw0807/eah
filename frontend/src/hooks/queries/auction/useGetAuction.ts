import { useQuery } from "@tanstack/react-query";
import { getAuctionDetail } from "@/apis/auction";

export function useGetAuction(
  auctionId: number
) {
  return useQuery({
    queryKey: ["auction", auctionId],
    queryFn: () => getAuctionDetail(auctionId),
    enabled: auctionId > 0,
  });
}
