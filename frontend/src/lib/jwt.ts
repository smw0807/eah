export interface JwtClaims {
  id: number;
  email: string;
  nickname: string;
  role: string;
  type?: "access" | "refresh";
  iat?: number;
  exp?: number;
}

/** JWT payload 를 검증 없이 디코드한다 (클라이언트에서 만료 확인 용도). */
export function decodeJwt(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

/** exp 클레임 기준으로 만료 여부를 반환한다. exp 가 없으면 만료로 간주. */
export function isJwtExpired(token: string | null | undefined, skewSec = 10): boolean {
  const claims = decodeJwt(token);
  if (!claims?.exp) return true;
  return claims.exp * 1000 <= Date.now() + skewSec * 1000;
}
