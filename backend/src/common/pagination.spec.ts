import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  paginated,
  parsePagination,
} from './pagination';

describe('parsePagination', () => {
  it('기본값: page=1, limit=DEFAULT_PAGE_SIZE', () => {
    expect(parsePagination()).toEqual({
      skip: 0,
      take: DEFAULT_PAGE_SIZE,
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
    });
  });

  it('문자열 쿼리 값을 숫자로 변환한다', () => {
    expect(parsePagination('3', '10')).toEqual({
      skip: 20,
      take: 10,
      page: 3,
      limit: 10,
    });
  });

  it('limit 은 MAX_PAGE_SIZE 로 상한 처리한다', () => {
    expect(parsePagination(1, 9999).limit).toBe(MAX_PAGE_SIZE);
  });

  it('0/음수/NaN page 는 1로 보정한다', () => {
    expect(parsePagination(0, 20).page).toBe(1);
    expect(parsePagination(-5, 20).page).toBe(1);
    expect(parsePagination('abc', 20).page).toBe(1);
  });

  it('0/음수 limit 은 최소 1 이상으로 보정한다', () => {
    expect(parsePagination(1, 0).limit).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePagination(1, -3).limit).toBe(1);
  });
});

describe('paginated', () => {
  it('표준 응답 형태를 만든다', () => {
    expect(paginated([1, 2], 5, 2, 2)).toEqual({
      data: [1, 2],
      total: 5,
      page: 2,
      limit: 2,
    });
  });
});
