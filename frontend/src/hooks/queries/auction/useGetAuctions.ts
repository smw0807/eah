import { getAuctions } from "@/apis/auction";
import type { AuctionsResponse, SearchAuctionsQuery } from "@/models/auction";
import { useQuery } from "@tanstack/react-query";

export function useGetAuctions(query: SearchAuctionsQuery) {
  return useQuery<AuctionsResponse>({
    // 필터 파라미터를 queryKey에 포함해 필터 변경 시 캐시를 별도로 관리
    queryKey: ["auctions", query],
    queryFn: () => getAuctions(query),
    staleTime: 30_000, // 30초간 캐시 유지 (불필요한 재요청 방지)
  });
}
