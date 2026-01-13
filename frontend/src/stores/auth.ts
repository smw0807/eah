import { create } from "zustand";
import { persist, combine, devtools } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
};

export const useAuthStore = create(
  devtools(
    persist(
      combine(initialState, (set, get) => ({
        actions: {
          getTokens: () => get(),
          setTokens: (accessToken: string, refreshToken: string) =>
            set({ accessToken, refreshToken }),
          clearTokens: () => set({ accessToken: null, refreshToken: null }),
          isAuthenticated: () => !!get().accessToken,
        },
      })),
      {
        name: "auth-storage",
      },
    ),
  ),
);

export const useAuthActions = () => {
  const { actions } = useAuthStore();
  return actions;
};

export const useAuthGetTokens = () => {
  const { actions } = useAuthStore();
  return actions.getTokens();
};

export const useAuthState = () => {
  const { accessToken, refreshToken } = useAuthStore();
  return { accessToken, refreshToken };
};

export const useAuthIsAuthenticated = () => {
  const { actions } = useAuthStore();
  return actions.isAuthenticated();
};
