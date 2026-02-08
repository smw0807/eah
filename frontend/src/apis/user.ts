import { get } from "@/lib/fetch";

export const getMyProfile = async () => {
  const response = await get(`/users/me`);
  return response.json();
};

export const getMySales = async () => {
  const response = await get(`/auctions/my-sales`);
  return response.json();
};

export const getMyBids = async () => {
  const response = await get(`/bids/my-bids`);
  return response.json();
};

export const getMyAccount = async () => {
  const response = await get(`/accounts`);
  return response.json();
};

export const getMyBidAuctions = async () => {
  const response = await get(`/auctions/my-bids`);
  return response.json();
};
