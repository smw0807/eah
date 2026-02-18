import { updateMyProfile } from "@/apis/user";
import type { UpdateMyProfileInput } from "@/models/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationCallback } from "../types";

export function useUpdateProfile(callback?: UseMutationCallback) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updateUser: UpdateMyProfileInput) => updateMyProfile(updateUser),
    onSuccess: (response) => {
      if (callback?.onSuccess) {
        callback.onSuccess(response);
      }
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
    onError: (error) => {
      if (callback?.onError) {
        callback.onError(error);
      }
    },
  });
}