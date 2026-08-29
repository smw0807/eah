import { useAuthStore } from "@/stores/auth";
import { isJwtExpired } from "@/lib/jwt";

const API_URL = import.meta.env.VITE_API_URL;

// refresh-retry 를 시도하지 않는 엔드포인트 (인증 자체를 수행하는 경로)
const NO_REFRESH_PATHS = ["/auth/signin", "/auth/signup", "/auth/refresh"];

// 공통 헤더 생성 함수
const getHeaders = (customHeaders?: Record<string, string>) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};

// 동시에 여러 요청이 401 을 받아도 refresh 는 한 번만 수행한다.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken || isJwtExpired(refreshToken)) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { access_token?: string };
        const next = data?.access_token ?? null;
        if (next) useAuthStore.getState().actions.setAccessToken(next);
        return next;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function onAuthFailure() {
  useAuthStore.getState().actions.clearTokens();
  if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/"
  ) {
    window.location.assign("/");
  }
}

/**
 * 모든 API 호출의 진입점.
 * 401 응답을 만나면 refresh 토큰으로 1회 재발급 후 원 요청을 재시도하고,
 * 재발급이 불가능하면 토큰을 비우고 홈으로 보낸다.
 */
async function request(
  path: string,
  init: RequestInit,
  retried = false,
): Promise<Response> {
  const res = await fetch(API_URL + path, init);

  if (
    res.status !== 401 ||
    retried ||
    NO_REFRESH_PATHS.some((p) => path.startsWith(p))
  ) {
    return res;
  }

  const newToken = await refreshAccessToken();
  if (!newToken) {
    onAuthFailure();
    return res;
  }

  const nextInit: RequestInit = {
    ...init,
    headers: {
      ...(init.headers as Record<string, string>),
      Authorization: `Bearer ${newToken}`,
    },
  };
  const retriedRes = await request(path, nextInit, true);
  if (retriedRes.status === 401) onAuthFailure();
  return retriedRes;
}

export const get = async (
  url: string,
  customHeaders?: Record<string, string>,
) => request(url, { method: "GET", headers: getHeaders(customHeaders) });

type Body = null | Record<
  string,
  string | number | boolean | null | undefined | Date | File
>;

const withBody =
  (method: "POST" | "PUT" | "PATCH") =>
  async (url: string, data: Body, customHeaders?: Record<string, string>) =>
    request(url, {
      method,
      headers: getHeaders(customHeaders),
      body: data ? JSON.stringify(data) : null,
    });

export const post = withBody("POST");
export const put = withBody("PUT");
export const patch = withBody("PATCH");

export const del = async (
  url: string,
  customHeaders?: Record<string, string>,
) => request(url, { method: "DELETE", headers: getHeaders(customHeaders) });

// multipart/form-data 요청 함수
export const postFormData = async (
  url: string,
  data: FormData,
  customHeaders?: Record<string, string>,
) => {
  // FormData 사용 시 Content-Type 을 지정하지 않아야 브라우저가 boundary 를 채운다.
  const headers: Record<string, string> = { ...customHeaders };
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return request(url, { method: "POST", headers, body: data });
};
