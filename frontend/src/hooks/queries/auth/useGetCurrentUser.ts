import { getCurrentUser } from "@/apis/auth";
import { useQuery } from "@tanstack/react-query";
import { useAuthIsAuthenticated } from "@/stores/auth";
import type { CurrentUser } from "@/models/auth";

export function useGetCurrentUser() {
  const isAuthenticated = useAuthIsAuthenticated();

  return useQuery<CurrentUser | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await getCurrentUser();
      if (response.statusCode === 200 && response.decoded) {
        return response.decoded;
      }
      return null;
    },
    enabled: isAuthenticated, // 로그인한 경우에만 실행
    retry: false, // 토큰 검증 실패 시 재시도하지 않음
  });
}

