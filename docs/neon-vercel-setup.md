# Neon Postgres + Vercel 배포 체크리스트

작업의뢰정보 게시판은 **Neon 무료 Postgres**와 Vercel 환경 변수로 연결합니다.

## 1. Neon 프로젝트 생성

1. [Neon Console](https://console.neon.tech)에서 계정 생성·로그인
2. **New Project**로 프로젝트 생성 (리전은 가까운 곳 권장)
3. Dashboard → **Connection details**
4. **Pooled connection** URI 복사 (Vercel 서버리스에 권장)

형식 예:

```text
postgresql://USER:PASSWORD@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

## 2. 로컬 `.env` 설정

루트의 `.env.example`을 복사해 `.env`를 만듭니다. (`.env`는 Git에 올리지 않습니다.)

```bash
cp .env.example .env
```

필수 값:

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | Neon pooled connection string |
| `AUTH_SECRET` | JWT 쿠키 서명용 비밀키 (16자 이상) |

`AUTH_SECRET` 생성 예:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

로컬 `.env`가 아직 `localhost`를 가리키면 Neon URI로 교체하세요.

## 3. 스키마 반영

`DATABASE_URL`이 Neon을 가리키는 상태에서:

```bash
npm run db:push
```

마이그레이션 폴더를 쓰는 경우:

```bash
npm run db:migrate
```

## 4. Vercel Environment Variables

Vercel Project → **Settings → Environment Variables**에 추가합니다.

- `DATABASE_URL` = Neon pooled URI
- `AUTH_SECRET` = 로컬과 동일하거나 배포 전용 비밀키

Environment는 **Production / Preview / Development** 중 필요한 범위를 선택합니다.

## 5. 배포 반영

1. 변경사항을 Git에 푸시
2. Vercel이 자동 재배포
3. `postinstall` / `build`에서 `prisma generate`가 실행됨
4. **최초 배포 전**에 3번 단계로 Neon에 스키마가 반영되어 있어야 함

배포 후 확인:

- `/jobs` 목록·검색
- `/auth/signup` → `/auth/login`
- 로그인 후 `/jobs/new` 공고 등록

## 참고

- 템플릿: 루트 [`.env.example`](../.env.example)
- README 요약: [README.md](../README.md)의 “Neon + Vercel 연결” 절
