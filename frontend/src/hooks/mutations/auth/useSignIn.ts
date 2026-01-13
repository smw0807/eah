import { signIn } from "@/apis/auth";
import type { SignInInput } from "@/models/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthActions } from "@/stores/auth";

export function useSignIn() {
  const { setTokens } = useAuthActions();

  return useMutation({
    mutationFn: ({ email, password }: SignInInput) =>
      signIn({ email, password }),
    onSuccess: (data) => {
      // 백엔드 응답: { message: 'Signin successful', access_token, refresh_token }
      const accessToken = data?.access_token;
      const refreshToken = data?.refresh_token;

      if (accessToken && refreshToken) {
        setTokens(accessToken, refreshToken);
        toast.success("로그인 성공", {
          position: "top-center",
        });
      } else {
        toast.error("토큰을 받지 못했습니다", {
          position: "top-center",
        });
      }
    },
    onError: () => {
      toast.error("로그인 실패", {
        position: "top-center",
      });
    },
  });
}
