export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * page/limit 쿼리 값을 안전한 범위로 정규화한다.
 * limit 은 MAX_PAGE_SIZE 로 상한을 두어 응답 크기를 제한한다.
 */
export function parsePagination(
  page?: number | string,
  limit?: number | string,
): { skip: number; take: number; page: number; limit: number } {
  const safeLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE,
  );
  const safePage = Math.max(Number(page) || 1, 1);
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
  };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return { data, total, page, limit };
}
