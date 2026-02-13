import { cancelAuction } from "@/apis/auction";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationCallback } from "../types";

export function useCancelAuction(callback?: UseMutationCallback) {
  return useMutation({
    mutationFn: (auctionId: number) => cancelAuction(auctionId),
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
