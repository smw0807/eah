export type UseMutationCallback = {
  onSuccess?: () => void;
  onMutate?: () => void;
  onSettled?: () => void;
  onError?: (error: Error) => void;
};
