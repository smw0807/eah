import { getMyBidAuctions } from "@/apis/user";
import { useQuery } from "@tanstack/react-query";

export function useGetMyBidAuctions() {
  return useQuery({
    queryKey: ["myBidAuctions"],
    queryFn: () => getMyBidAuctions(),
  });
}
