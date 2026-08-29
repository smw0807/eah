import { get, patch } from "@/lib/fetch";;
import type { UpdateMyProfileInput } from "@/models/user";

export const getMyProfile = async () => {
  const response = await get(`/users/me`);
  return response.json();
};

// 마이페이지 목록: 서버가 { data, total, page, limit } 형태로 응답한다.
// 현재 UI 는 클라이언트에서 slice 하므로 최대치(100)를 한 번에 받아 data 만 반환한다.
type Paginated = {
  data: unknown[];
  total: number;
  page: number;
  limit: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrapList = (res: Paginated | any[]): any[] =>
  Array.isArray(res) ? res : (res?.data ?? []);

export const getMySales = async () => {
  const response = await get(`/auctions/my-sales?page=1&limit=100`);
  return unwrapList(await response.json());
};

export const getMyBids = async () => {
  const response = await get(`/bids/my-bids?page=1&limit=100`);
  return unwrapList(await response.json());
};

export const getMyAccount = async () => {
  const response = await get(`/accounts`);
  return response.json();
};

export const getMyBidAuctions = async () => {
  const response = await get(`/auctions/my-bids?page=1&limit=100`);
  return unwrapList(await response.json());
};

export const updateMyProfile = async (updateUser: UpdateMyProfileInput) => {
  const response = await patch(`/users/me`, {
    email: updateUser.email,
    password: updateUser.password,
    name: updateUser.name,
    nickname: updateUser.nickname,
  });
  return response.json();
};