import { getMyProfile } from "@/apis/user";
import { useQuery } from "@tanstack/react-query";

export function useGetMyProfile() {
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: () => getMyProfile(),
  });
}
