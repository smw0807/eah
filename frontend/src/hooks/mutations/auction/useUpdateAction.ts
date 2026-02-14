import { useMutation } from "@tanstack/react-query";
import type { UseMutationCallback } from "../types";
import type { AuctionUpdateInput } from "@/models/auction";
import { updateAuction } from "@/apis/auction";

export function useUpdateAuction(callback?: UseMutationCallback) {
  return useMutation({
    mutationFn: ({
      auctionId,
      updateAuctionInput,
    }: {
      auctionId: number;
      updateAuctionInput: AuctionUpdateInput;
    }) => updateAuction(auctionId, updateAuctionInput),
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
