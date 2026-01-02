export type Token = {
  access_token: string;
  refresh_token: string;
};

export type TokenInfo = {
  token_type: string;
  expiry_date: number | string;
  access_expiry_date?: number | string;
  refresh_expiry_date?: number | string;
} & Token;
