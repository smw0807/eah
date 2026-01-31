import { create } from "zustand";
import { combine, devtools } from "zustand/middleware";

const initialState = {
  isOpen: false,
  currentPrice: 0,
  minBidStep: 0,
  nextBidAmount: 0,
  auctionId: 0,
};

const useBidModalStore = create(
  devtools(
    combine(initialState, (set) => ({
      actions: {
        open: () => set({ isOpen: true }),
        close: () => set({ isOpen: false }),
        setCurrentPrice: (currentPrice: number) => set({ currentPrice }),
        setMinBidStep: (minBidStep: number) => set({ minBidStep }),
        setNextBidAmount: (nextBidAmount: number) => set({ nextBidAmount }),
        setAuctionId: (auctionId: number) => set({ auctionId }),
      },
    })),
    {
      name: "bidModal",
    },
  ),
);

export const useOpenBidModal = () => {
  const open = useBidModalStore((store) => store.actions.open);
  return open;
};

export const useBidModalActions = () => {
  const actions = useBidModalStore((store) => store.actions);
  return actions;
};

export const useBidModal = () => {
  const store = useBidModalStore();
  return store;
};
