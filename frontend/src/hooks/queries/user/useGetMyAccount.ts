import { getMyAccount } from "@/apis/user";
import { useQuery } from "@tanstack/react-query";

export function useGetMyAccount() {
  return useQuery({
    queryKey: ["myAccount"],
    queryFn: () => getMyAccount(),
  });
}
