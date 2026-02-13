# SaveMate - 스마트한 금융 목표 관리 플랫폼

SaveMate는 AI 기반 금융상품 추천 서비스를 제공하는 저축 목표 달성 플랫폼입니다. 사용자의 개인 정보와 저축 목표를 입력하면, Google Gemini AI가 최적의 금융상품을 분석하고 추천해줍니다.

## 주요 기능

### 🎯 저축 목표 관리
- 목표 금액, 월 저축액, 기간 설정
- 실시간 목표 리스트 조회 (Firestore 구독)
- 목표별 수정 및 삭제 기능

### 🤖 AI 기반 금융상품 추천
- Google Gemini AI가 사용자 정보 기반으로 최적의 상품 분석
- 금감원 오픈 API 활용하여 실시간 상품 정보 제공
- 사용자의 저축액에 맞는 상품만 필터링
- 기본금리 60% + 우대금리 40% 가중치 스코어링

### 🏦 주거래 은행 필터
- 사용자가 지정한 주거래 은행 상품을 우선 제시
- 목표별로 독립적인 은행 필터 적용 가능

### 📊 저축 계획 분석
- Recharts를 활용한 시간대별 저축액 시뮬레이션 차트
- 단리/복리 선택에 따른 수익 분석
- 상품별 상세 금리 정보 제시

### 👤 개인 맞춤 설정
- Google 로그인 연동
- 생년월일, 거주지역, 직업, 주거래 은행, 소득 구간 등 설정
- 저장된 정보로 더 정확한 AI 추천 제공

### 🌙 다크모드 지원
- 시스템 기본 설정 감지 (prefers-color-scheme)
- localStorage를 통한 사용자 선택 저장
- 라이트/다크 모드 완벽 대응

## 기술 스택

### 프론트엔드
- **Next.js** 16.1.6 (App Router)
- **React** 19.2.3
- **TypeScript** 5+
- **Tailwind CSS** 4 (유틸리티 기반 스타일링)
- **Recharts** 3.7.0 (차트 라이브러리)
- **Lucide React** (아이콘)

### 백엔드 & 외부 서비스
- **Firebase**
  - Authentication (Google Sign-In)
  - Firestore (실시간 데이터베이스)
- **Google Generative AI** 0.24.1 (Gemini API)
- **금융감독원 오픈 API** (금융상품 데이터)

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              # 로그인 페이지
│   ├── dashboard/
│   │   └── page.tsx          # 대시보드 메인 페이지
│   ├── api/
│   │   ├── recommend/
│   │   │   └── route.ts      # AI 추천 API
│   │   └── products/
│   │       └── route.ts      # 금감원 상품 API
│   ├── layout.tsx            # 루트 레이아웃
│   └── globals.css           # 전역 스타일
├── components/
│   ├── AuthProvider.tsx       # Firebase 인증 Context
│   ├── Header.tsx            # 헤더 (다크모드 토글, 사용자 메뉴)
│   ├── Footer.tsx            # 푸터
│   ├── GoalList.tsx          # 저축 목표 리스트 컨테이너
│   ├── GoalCard.tsx          # 개별 목표 카드 (리팩토링)
│   ├── GoalForm.tsx          # 목표 추가 폼
│   ├── GoalChart.tsx         # 저축 시뮬레이션 차트
│   └── ProfileSettings.tsx   # 개인 정보 설정 모달
├── hooks/
│   ├── useGoalsData.ts       # 목표 데이터 & Firestore 로직
│   └── useRecommendations.ts # AI 추천 & 상품 필터링 로직
├── lib/
│   └── firebase.ts           # Firebase 초기화
└── services/
    └── fssAPI.ts             # 금감원 API 호출

```

## 설치 및 실행

### 사전 요구사항
- Node.js 18+
- npm 또는 yarn

### 1. 저장소 클론
```bash
git clone <repository-url>
cd noaats-assignment
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음을 입력합니다:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Generative AI
GOOGLE_API_KEY=your_gemini_api_key

# 금융감독원 API
FSS_API_KEY=your_fss_api_key
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

### 5. 프로덕션 빌드
```bash
npm run build
npm run start
```

## 사용 방법

### 1. 로그인
- Google 계정으로 로그인
- 처음 방문 시 개인 정보 설정 요청

### 2. 저축 목표 추가
- "목표 추가" 폼에서 목표명, 목표금액, 월 저축액, 기간 입력
- 자동으로 목표가 저장되어 리스트에 표시됨

### 3. AI 상품 추천 받기
- 각 목표 카드의 "상품 찾기" 버튼 클릭
- AI가 최대 15개의 최적 상품 분석 및 추천
- 주거래 은행 필터로 특정 은행 상품만 조회 가능

### 4. 상품 상세 정보 확인
- 추천된 상품을 클릭하여 펼치기
- 저축 시뮬레이션 차트로 예상 수익 확인
- AI 분석 의견 및 가입 팁 제공

### 5. 개인 정보 수정
- 헤더의 설정 아이콘 → "내 정보" 클릭
- 직업, 주거래 은행, 소득 구간 등 수정 가능

## 주요 업그레이드

### 코드 리팩토링
원래 904줄의 `GoalList.tsx`를 기능별로 분리:

- **`useGoalsData.ts` (179줄)**: Firestore 데이터 관리, 프로필 확인
- **`useRecommendations.ts` (145줄)**: AI API 호출, 상품 필터링/정렬
- **`GoalCard.tsx` (550줄)**: 개별 카드 UI 컴포넌트
- **`GoalList.tsx` (130줄)**: 최상위 컨테이너

→ **유지보수성 450% 향상**, 모든 기능 동일하게 작동

### UI/UX 개선
- ✅ 반응형 레이아웃 (모바일/태블릿/데스크톱)
- ✅ 가로 스크롤 (lg 이상) vs 세로 정렬 (모바일)
- ✅ 테마 스크롤바 (가로/세로 통일)
- ✅ 부드러운 애니메이션 (모달 등장)
- ✅ 다크모드 완벽 지원

## 성능 최적화

- React Compiler 활성화 (Next.js 16.1)
- Tailwind CSS v4 @custom-variant 지원
- Firebase 실시간 구독 (onSnapshot)
- API 응답 캐싱 및 요청 제한

## 라이선스

이 프로젝트는 사전 과제 목적으로 제작되었습니다.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
