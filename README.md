# 메디커넥트 (MVP)

`docs/설계기획서.md` · `docs/웹설계서.md` · `docs/화면기획서.md` 기반으로 만든 웹앱입니다.
Vercel 배포를 전제로, DB는 Postgres(Neon), 파일 저장은 Vercel Blob, 로그인은 JWT 쿠키 방식을 사용합니다.

## 로컬 실행 방법

이 컴퓨터에는 Node.js가 시스템에 설치되어 있지 않아, `../tools/node/`에 포터블 버전을 받아뒀습니다.

```bash
cd app
../tools/node/node.exe server/index.js
```

다른 컴퓨터(팀원 PC)에서 실행할 때는 Node.js 20 이상을 설치한 뒤:

```bash
cd app
npm install
npm start
```

로컬 실행에도 아래 환경 변수(.env)에 실제 `DATABASE_URL`·`BLOB_READ_WRITE_TOKEN` 값이 있어야 합니다 (Postgres/Blob 없이는 서버가 시작되지 않습니다).

## 환경 변수 (.env)

`.env.example`을 복사해 `.env`를 만들고 값을 채우세요. **`.env`는 git에 올리지 마세요** (`.gitignore`에 이미 포함).

- `DUR_API_KEY_ENCODED`: 식약처 공공데이터포털 "의약품안전사용서비스(DUR)품목정보" 서비스키 (URL 인코딩된 형태 그대로)
- `SESSION_SECRET`: 로그인 토큰(JWT) 서명용 비밀키
- `DATABASE_URL`: Vercel 프로젝트의 Storage 탭에서 Postgres(Neon)를 생성하면 자동 발급됨
- `BLOB_READ_WRITE_TOKEN`: Vercel 프로젝트의 Storage 탭에서 Blob을 생성하면 자동 발급됨

Vercel에 프로젝트를 연결한 뒤 `vercel env pull .env`로 위 값들을 한 번에 받아올 수 있습니다.

## 구현 범위와 한계 (MVP)

- **OCR**: 실제 OCR 엔진 연동 대신, "인식하기" 버튼을 누르면 예시 데이터로 폼을 채우는 모의 기능입니다.
- **병원 실시간 연동(HIE)**: 실시간 시스템 연동 대신, 사용자가 진료 기록 등록 시 진단서·검사결과지 파일(이미지/PDF, 최대 5개, 개당 10MB)을 직접 첨부해 병원별 자료를 본인이 통합 관리합니다. 파일은 Vercel Blob(private 스토어)에 저장되고, `/api/files/:id`가 DB에서 소유권을 확인한 뒤 서버가 직접 Blob에서 인증된 스트림을 받아 응답합니다. Blob URL 자체가 공개적으로 열람 가능하지 않습니다.
- **약물 상호작용 검색**: 식약처 DUR API(병용금기)와 내부 참고 데이터(자몽·우유 등 음식 상호작용, DUR에 없는 항목)를 함께 조회해 병합합니다.
  - DUR API는 등록된 제품명(브랜드명) 기준으로 부분 일치 검색되므로, 사용자가 입력한 일반 성분명이 실제 제품명 문자열에 포함되지 않으면 매칭되지 않을 수 있습니다. 이 경우 내부 참고 데이터가 있으면 그것으로 보완됩니다.
- **로그인 세션**: 서버리스 환경에서는 메모리 기반 세션이 유지되지 않으므로, httpOnly 쿠키에 담은 JWT로 로그인 상태를 관리합니다(별도 세션 저장소 불필요).

## 배포 (Vercel)

1. GitHub `team2` 저장소에 이 코드를 푸시
2. Vercel에서 해당 저장소를 Import (Root Directory를 `app`으로 지정)
3. 프로젝트의 Storage 탭에서 **Postgres**와 **Blob**을 각각 생성 → `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`이 자동으로 환경 변수에 추가됨
4. `DUR_API_KEY_ENCODED`, `SESSION_SECRET`은 Vercel 프로젝트 설정의 Environment Variables에 직접 추가
5. Deploy
