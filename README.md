# 모두의 경매장 (Everyone's Auction House - EAH)

간단한 경매장 웹 서비스입니다. 회원가입·로그인 후 경매 상품을 등록하고, 실시간 입찰·즉시 구매를 할 수 있습니다.

---

## 기술 스택

### Frontend

- **React 19** + **TypeScript**
- **Vite** — 빌드 도구
- **React Router** — 라우팅
- **TanStack Query** — 서버 상태·캐시
- **Zustand** — 클라이언트 상태 (auth, 모달 등)
- **Tailwind CSS** — 스타일링
- **Shadcn/ui** — 다이얼로그, 셀렉트 등 UI 컴포넌트
- **Socket.io Client** — 경매 실시간 업데이트
- **Sonner** — 토스트 알림

### Backend

- **NestJS** — API 서버
- **Prisma** — ORM
- **PostgreSQL** — DB
- **JWT** — 인증 (Access / Refresh)
- **Socket.io** — 실시간 입찰·상태 브로드캐스트
- **Supabase** — 이미지 스토리지
- **bcrypt** — 비밀번호 해싱
- **NestJS Schedule** — 경매 종료 스케줄링

---

## 완성된 기능

### 인증

- 회원가입 (닉네임, 이메일, 비밀번호) — 이메일/닉네임 중복 검사
- 로그인 (Basic Base64 인증 후 JWT 발급)
- 토큰 검증 (`/auth/verify-token`)
- 로그인 필요 라우트는 `UserLayout`에서 리다이렉트

### 경매

- **목록 조회** — 카테고리, 정렬, 가격/검색/상태 필터
- **상세 조회** — 단일 경매 상품 정보
- **등록** — 상품명, 설명, 카테고리, 시작가·즉시구매가, 입찰 단위, 기간, 이미지 (Supabase 업로드)
- **수정** — 본인 경매만 수정 가능, 입찰 없을 때만 (수정 모드에서 기존 데이터 로드 후 폼 수정)
- **취소** — 본인 경매만, 입찰 없을 때만
- **진행 중 여부** — 현재 진행 중인 경매인지 확인 API

### 입찰·즉시 구매

- **입찰** — 최소 입찰 단위 지정, 잔액 잠금/해제, 마지막 입찰자 재입찰 불가, 판매자 자기 상품 입찰 불가
- **즉시 구매** — 즉시구매가 결제, 잔액 차감·판매자 입금, 경매 종료 처리
- 실시간 반영 — **WebSocket**으로 입찰·즉시구매·상태 변경 시 상세 페이지 갱신

### 마이페이지 (로그인 필요)

- **프로필** — 이름, 닉네임, 이메일, 가입일
- **계좌** — 현재 잔액, 잠금 잔액 (최초 계좌 생성 지원)
- **내 판매** — 내가 등록한 경매 목록
- **내 입찰** — 내가 입찰한 경매 목록
- **낙찰 목록** — 내가 낙찰받은 경매

### 기타

- **카테고리** — 최상위/하위 카테고리 조회 (관리자: 생성·수정·삭제)
- **이미지 업로드** — 로그인 사용자, Supabase 스토리지 연동
- **최초 로그인** - 최초 로그인 시에만 잔액을 지급하도록 설계함
---

## 프로젝트 구조

```
eah/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── apis/      # API 호출
│   │   ├── components/ # UI·모달·카드 등
│   │   ├── hooks/     # queries, mutations, WebSocket
│   │   ├── layouts/   # DefaultLayout, UserLayout
│   │   ├── pages/     # 홈, 경매 상세, 등록/수정, 마이페이지
│   │   ├── stores/    # auth, 모달 상태
│   │   └── lib/       # fetch, toast, constants
│   └── ...
├── backend/           # NestJS
│   ├── src/
│   │   ├── accounts/  # 계좌 생성·조회
│   │   ├── auth/      # 로그인·회원가입·JWT
│   │   ├── auctions/  # 경매 CRUD, 스케줄러, WebSocket Gateway
│   │   ├── bids/      # 입찰·즉시구매
│   │   ├── category/  # 카테고리
│   │   ├── images/    # Supabase 이미지 업로드
│   │   ├── users/     # 프로필 등
│   │   └── ...
│   └── prisma/        # 스키마·마이그레이션
└── README.md
```

---

## 실행 방법

### 사전 요구사항

- Node.js (권장 LTS)
- PostgreSQL
- Supabase 프로젝트 (이미지 스토리지용)

### Backend

1. 디렉터리 이동 및 의존성 설치

   ```bash
   cd backend
   npm install
   ```

2. 환경 변수 설정  
   `backend/.env`에 다음 항목을 설정합니다.

   - `DATABASE_URL` — PostgreSQL 연결 문자열
   - `APP_FULL_NAME`, `APP_NAME`, `APP_PORT` — 앱 설정
   - `LOG_LEVEL`
   - `BCRYPT_SALT`, `JWT_SECRET`, `ACCESS_EXPIRED_DATE`, `REFRESH_EXPIRED_DATE` — 인증
   - `CORS_ORIGIN`, `CORS_METHODS`, `CORS_ALLOWED_HEADERS` — CORS
   - `SUPABASE_URL`, `SUPABASE_API_KEY` — 이미지 업로드

3. Prisma 마이그레이션 및 클라이언트 생성

   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. 서버 실행

   ```bash
   npm run start:dev
   ```

   기본 포트: `3000`, API prefix: `/api`

### Frontend

1. 디렉터리 이동 및 의존성 설치

   ```bash
   cd frontend
   npm install
   ```

2. 환경 변수  
   `frontend/.env`에 백엔드 API 및 Socket.io 주소를 설정합니다.

   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_WS_URL=http://localhost:3000/bid
   ```

3. 개발 서버 실행

   ```bash
   npm run dev
   ```

브라우저에서 프론트엔드 주소(예: `http://localhost:5173`)로 접속하면 됩니다.

---

## 주요 라우트 (Frontend)

| 경로 | 설명 | 인증 |
|------|------|------|
| `/` | 경매 목록 (카테고리·필터) | - |
| `/auctions/:id` | 경매 상세 (입찰·즉시구매·실시간) | 필요 |
| `/auction/create` | 경매 등록 | 필요 |
| `/auction/update/:id` | 경매 수정 | 필요 |
| `/mypage` | 마이페이지 | 필요 |
| `/mypage/sales` | 내 판매 목록 | 필요 |
| `/mypage/bids` | 내 입찰 목록 | 필요 |
| `/mypage/won-auctions` | 낙찰 목록 | 필요 |

---

## API 개요 (Backend)

- **Prefix**: `/api`
- **Auth**: `POST /auth/signup`, `POST /auth/signin`, `POST /auth/verify-token`
- **경매**: `GET/POST /auctions`, `GET/PATCH /auctions/:id`, `PATCH /auctions/:id/cancel`, `GET /auctions/current`, `GET /auctions/my-sales`, `GET /auctions/my-bids`
- **입찰**: `POST /bids/create`, `POST /bids/buyout`, `GET /bids/auction/:auctionId`, `GET /bids/my-bids` 등
- **계좌**: `GET/POST /accounts`, `POST /accounts/create`
- **사용자**: `GET /users/me`
- **카테고리**: `GET /category`, `GET /category/get-top-categories`, `GET /category/get-sub-categories/:parentId` 등
- **이미지**: `POST /images/upload` (multipart)

인증이 필요한 API는 `Authorization: Bearer <access_token>` 헤더를 사용합니다.
