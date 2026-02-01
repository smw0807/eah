import { createBuyout } from "@/apis/bid";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationCallback } from "../types";

export function useCreateBuyout(callback?: UseMutationCallback) {
  return useMutation({
    mutationFn: (auctionId: number) => createBuyout(auctionId),
    onSuccess: (data) => {
      if (callback?.onSuccess) {
        callback.onSuccess(data);
      }
    },
    onError: (error) => {
      if (callback?.onError) {
        callback.onError(error);
      }
    },
  });
}
