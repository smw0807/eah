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
  data: null | Record<
    string,
    string | number | boolean | null | undefined | Date | File
  >,
  customHeaders?: Record<string, string>,
) => {
  return fetch(import.meta.env.VITE_API_URL + url, {
    method: "POST",
    headers: getHeaders(customHeaders),
    body: data ? JSON.stringify(data) : null,
  });
};

export const put = async (
  url: string,
  data: null | Record<
    string,
    string | number | boolean | null | undefined | Date | File
  >,
  customHeaders?: Record<string, string>,
) => {
  return fetch(import.meta.env.VITE_API_URL + url, {
    method: "PUT",
    headers: getHeaders(customHeaders),
    body: data ? JSON.stringify(data) : null,
  });
};

export const patch = async (
  url: string,
  data: null | Record<
    string,
    string | number | boolean | null | undefined | Date | File
  >,
  customHeaders?: Record<string, string>,
) => {
  return fetch(import.meta.env.VITE_API_URL + url, {
    method: "PATCH",
    headers: getHeaders(customHeaders),
    body: data ? JSON.stringify(data) : null,
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

// multipart/form-data 요청 함수
export const postFormData = async (
  url: string,
  data: FormData,
  customHeaders?: Record<string, string>,
) => {
  // FormData를 사용할 때는 Content-Type을 설정하지 않아야 브라우저가 자동으로 boundary를 포함한 헤더를 설정합니다
  const headers: Record<string, string> = { ...customHeaders };

  // 토큰이 있으면 자동으로 추가
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(import.meta.env.VITE_API_URL + url, {
    method: "POST",
    headers,
    body: data, // FormData는 Content-Type을 자동으로 설정합니다 (boundary 포함)
  });
};
