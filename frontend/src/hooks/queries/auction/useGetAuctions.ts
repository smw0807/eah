import { getAuctions } from "@/apis/auction";
import type { AuctionsResponse, SearchAuctionsQuery } from "@/models/auction";
import { useInfiniteQuery } from "@tanstack/react-query";

const LIMIT = 6;

type AuctionFilters = Omit<SearchAuctionsQuery, "page" | "limit">;

export function useGetAuctions(query: AuctionFilters) {
  return useInfiniteQuery<AuctionsResponse>({
    queryKey: ["auctions", query],
    queryFn: ({ pageParam }) =>
      getAuctions({ ...query, page: pageParam as number, limit: LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage;
      return page * limit < total ? page + 1 : undefined;
    },
    staleTime: 30_000,
  });
}
