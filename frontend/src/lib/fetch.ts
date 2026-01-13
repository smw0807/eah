import { useAuthStore } from "@/stores/auth";

// 공통 헤더 생성 함수
const getHeaders = (customHeaders?: Record<string, string>) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  // 토큰이 있으면 자동으로 추가
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};

export const get = async (
  url: string,
  customHeaders?: Record<string, string>,
) => {
  return fetch(import.meta.env.VITE_API_URL + url, {
    method: "GET",
    headers: getHeaders(customHeaders),
  });
};

export const post = async (
  url: string,
  data: null | Record<string, string | number | boolean | null | undefined>,
  customHeaders?: Record<string, string>,
) => {
  return fetch(import.meta.env.VITE_API_URL + url, {
    method: "POST",
    headers: getHeaders(customHeaders),
    body: JSON.stringify(data),
  });
};

export const put = async (
  url: string,
  data: null | Record<string, string | number | boolean | null | undefined>,
  customHeaders?: Record<string, string>,
) => {
  return fetch(import.meta.env.VITE_API_URL + url, {
    method: "PUT",
    headers: getHeaders(customHeaders),
    body: JSON.stringify(data),
  });
};

export const del = async (
  url: string,
  customHeaders?: Record<string, string>,
) => {
  return fetch(import.meta.env.VITE_API_URL + url, {
    method: "DELETE",
    headers: getHeaders(customHeaders),
  });
};
