import { getMyBids } from "@/apis/user";
import { useQuery } from "@tanstack/react-query";

export function useGetMyBids() {
  return useQuery({
    queryKey: ["myBids"],
    queryFn: () => getMyBids(),
  });
}
