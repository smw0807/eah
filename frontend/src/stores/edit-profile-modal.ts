import { create } from "zustand";
import { combine } from "zustand/middleware";

const initialState = {
  isOpen: false,
};

const useProfileEditModalStore = create(
  combine(initialState, (set) => ({
    actions: {
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    },
  })),
);

export const useOpenProfileEditModal = () => {
  const open = useProfileEditModalStore((store) => store.actions.open);
  return open;
};

export const useProfileEditModal = () => {
  const store = useProfileEditModalStore();
  return store;
};
