# 경매 스케줄러 설정 가이드

## 패키지 설치

```bash
cd backend
yarn add @nestjs/schedule
```

## 구현 내용

### AuctionsScheduler (`backend/src/auctions/auctions.scheduler.ts`)

- **1분마다 자동 실행**되는 스케줄러
- 두 가지 기능 수행:
  1. **경매 시작**: `SCHEDULED` 상태이고 `startAt <= 현재시간`인 경매를 `OPEN`으로 변경
  2. **경매 종료**: `OPEN` 상태이고 `endAt <= 현재시간`인 경매를 `CLOSED`로 변경

### 주요 기능

- 종료된 경매의 경우 가장 높은 입찰을 `winningBidId`로 설정
- WebSocket을 통해 실시간으로 상태 변경 브로드캐스트
- 상세한 로깅으로 스케줄러 동작 추적

### 모듈 등록

- `ScheduleModule.forRoot()`가 `AppModule`에 등록됨
- `AuctionsScheduler`가 `AuctionsModule`에 등록됨

## 작동 방식

1. **매 1분마다** 스케줄러가 자동 실행
2. 종료 시간이 지난 `OPEN` 상태 경매 조회
3. 각 경매에 대해:
   - 상태를 `CLOSED`로 변경
   - 가장 높은 입찰을 `winningBidId`로 설정
   - WebSocket으로 모든 연결된 클라이언트에 상태 변경 알림
4. 로그에 처리 결과 기록

## 테스트 방법

1. 종료 시간이 지난 경매를 생성
2. 1분 후 로그에서 스케줄러 실행 확인
3. 경매 상태가 `CLOSED`로 변경되었는지 확인
4. WebSocket으로 연결된 클라이언트에서 실시간 업데이트 확인
