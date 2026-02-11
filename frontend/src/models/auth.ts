export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  nickname: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  nickname: string;
  role: string;
}

export interface VerifyTokenResponse {
  message: string;
  statusCode: number;
  decoded?: CurrentUser;
}
