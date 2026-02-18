import { signIn } from "@/apis/auth";
import type { SignInInput } from "@/models/auth";
import { useMutation } from "@tanstack/react-query";

import { useAuthActions } from "@/stores/auth";
import type { UseMutationCallback } from "../types";
import { toastError } from "@/lib/toast";

export function useSignIn(callback?: UseMutationCallback) {
  const { setTokens } = useAuthActions();

  return useMutation({
    mutationFn: ({ email, password }: SignInInput) =>
      signIn({ email, password }),
    onSuccess: (data) => {
      const accessToken = data?.access_token;
      const refreshToken = data?.refresh_token;
      if (accessToken && refreshToken) {
        setTokens(accessToken, refreshToken);
      }

      if (callback?.onSuccess) {
        callback.onSuccess(data);
      }
    },
    onError: (error) => {
      console.log(error);
      toastError("로그인 실패");
    },
  });
}
