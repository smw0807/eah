import { create } from "zustand";
import { persist, combine, devtools } from "zustand/middleware";
import { isJwtExpired } from "@/lib/jwt";

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
          setAccessToken: (accessToken: string) => set({ accessToken }),
          clearTokens: () => set({ accessToken: null, refreshToken: null }),
          // access 가 살아있거나, 만료됐어도 refresh 로 갱신 가능하면 인증 상태로 본다.
          isAuthenticated: () => {
            const { accessToken, refreshToken } = get();
            if (accessToken && !isJwtExpired(accessToken)) return true;
            return !!refreshToken && !isJwtExpired(refreshToken);
          },
        },
      })),
      {
        name: "auth-storage",
        partialize: (state) => ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          // actions는 persist에서 제외
        }),
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
