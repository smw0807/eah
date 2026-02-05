import { getMySales } from "@/apis/user";
import { useQuery } from "@tanstack/react-query";

export function useGetMySales() {
  return useQuery({
    queryKey: ["mySales"],
    queryFn: () => getMySales(),
  });
}
