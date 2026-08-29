-- 계좌 잔액 무결성 (동시 입찰/정산 경쟁 조건으로 음수 잔액이 되는 것을 DB 레벨에서 차단)
-- CHECK 제약은 Prisma 스키마로 표현할 수 없으므로 raw SQL 마이그레이션으로 관리한다.

-- 제약 추가 전, 기존 버그로 음수가 된 값이 있으면 0으로 보정하여 마이그레이션이 항상 적용되도록 한다.
UPDATE "user_accounts" SET "current_amount" = 0 WHERE "current_amount" < 0;
UPDATE "user_accounts" SET "locked_amount" = 0 WHERE "locked_amount" < 0;

ALTER TABLE "user_accounts"
  ADD CONSTRAINT "user_accounts_current_amount_non_negative"
  CHECK ("current_amount" >= 0);

ALTER TABLE "user_accounts"
  ADD CONSTRAINT "user_accounts_locked_amount_non_negative"
  CHECK ("locked_amount" >= 0);

-- 입찰 금액은 항상 양수
UPDATE "bids" SET "amount" = 1 WHERE "amount" <= 0;

ALTER TABLE "bids"
  ADD CONSTRAINT "bids_amount_positive"
  CHECK ("amount" > 0);
