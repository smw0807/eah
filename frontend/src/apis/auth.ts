import { post } from "@/lib/fetch";
import type { SignInInput, SignUpInput, VerifyTokenResponse } from "@/models/auth";

export const signIn = async ({ email, password }: SignInInput) => {
  const response = await post(`/auth/signin`, null, {
    Authorization: `Basic ${btoa(`${email}:${password}`)}`,
  });
  return response.json();
};

export const signUp = async ({
  email,
  password,
  name,
  nickname,
}: SignUpInput) => {
  const response = await post(`/auth/signup`, {
    email,
    password,
    name,
    nickname,
  });
  return response.json();
};

// 토큰 검증 (토큰을 파라미터로 받는 버전)
export const verifyToken = async (token: string) => {
  const response = await post(`/auth/verify-token`, null, {
    Authorization: `Bearer ${token}`,
  });
  return response.json() as Promise<VerifyTokenResponse>;
};

// 현재 사용자 정보 가져오기 (토큰은 자동으로 헤더에 추가됨)
export const getCurrentUser = async () => {
  const response = await post(`/auth/verify-token`, null);
  return response.json() as Promise<VerifyTokenResponse>;
};
