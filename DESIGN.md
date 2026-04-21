# Design System — Bluecollar CV

## Product Context
- **What this is:** 블루칼라 현장 전문가(타일, 배관, 전기, 도배 등)를 위한 디지털 포트폴리오 플랫폼
- **Who it's for:** 시공 기술자 — 명함 대신 링크 하나로 자신의 전문성을 증명하고 싶은 사람
- **Space/industry:** 구인/구직 + 프로필 플랫폼 (LinkedIn for 현장 기술자)
- **Project type:** Web app (모바일 퍼스트) + 공개 프로필 페이지

## Aesthetic Direction
- **Direction:** Clean Product UI — 기능이 앞에 나오고, 장식은 뒤에 있는 방향
- **Decoration level:** Minimal — 타이포그래피와 여백이 디자인을 대신함
- **Mood:** 신뢰감 있고 군더더기 없는 도구. "나 이걸 잘한다"를 조용히 말하는 명함.
  Notion, Linear처럼 정제된 느낌. 절대 화려하지 않음.

## Typography
- **Body / UI:** Pretendard — 한국어 최적화, 굵기 대비 선명, 무겁지 않음
- **Code/Mono:** Geist Mono
- **Loading:** CDN — `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css`
- **Weight 규칙:**
  - 700: 페이지 제목, 강조 숫자
  - 600: 섹션 제목, 버튼
  - 500: 서브 레이블, 네비게이션
  - 400: 본문, 설명
- **Scale (모바일 퍼스트):**
  - xs: 12px / 1.4
  - sm: 14px / 1.5
  - base: 16px / 1.6
  - lg: 18px / 1.5
  - xl: 20px / 1.4
  - 2xl: 24px / 1.3
  - 3xl: 30px / 1.2
  - 4xl: 36px / 1.1

## Color
- **Approach:** Restrained — primary는 한 번만 씀. 나머지는 중립.
- **Primary:** `#292524` — Deep Stone. 따뜻한 다크 브라운. 시공 재료(흙·돌·콘크리트)에서 온 색. 버튼, 링크, 포커스링에만.
- **Primary dark mode:** `#3D3835` — 다크에서 살짝 밝게 (대비 유지)
- **Accent (subtle):** `#F5F0EB` bg / `#292524` fg — primary를 배경으로 쓸 때 (배지, 하이라이트)
- **Neutrals:**
  - Background: `#FFFFFF`
  - Card/Surface: `#FFFFFF` (border로 구분)
  - Secondary/Muted bg: `#F6F4F2`
  - Border: `#E5E0DB`
  - Input border: `#E5E0DB`
  - Muted text: `#6B5E57`
  - Body text: `#1C1917`
- **Semantic:**
  - Success: `#16A34A` / bg `#F0FDF4`
  - Warning: `#D97706` / bg `#FFFBEB`
  - Error (destructive): `#DC2626` / bg `#FEF2F2` / fg `#FFFFFF`
  - Info: `#2563EB` / bg `#EFF6FF`
- **Dark mode 원칙:**
  - 배경: `#141414` (순수 검정 아님, 눈에 덜 부담)
  - 카드: `#1C1C1C` (elevation +1)
  - 보조: `#262626` (elevation +2)
  - 텍스트: `#E8E8E8` (순백 아님, off-white)
  - Muted: `#8A8A8A`
  - Primary: `#FF7A1A` (대비 유지를 위해 약간 밝게)

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable (앱) / Spacious (공개 프로필)
- **Scale:**
  - 2: 0.5rem (8px)
  - 3: 0.75rem (12px)
  - 4: 1rem (16px)
  - 5: 1.25rem (20px)
  - 6: 1.5rem (24px)
  - 8: 2rem (32px)
  - 10: 2.5rem (40px)
  - 12: 3rem (48px)
  - 16: 4rem (64px)
- **페이지 패딩 (모바일):** px-5 (20px) 기본, px-6 (24px) 여유있는 섹션

## Layout
- **Approach:** Mobile-first, single column. 데스크탑에서 max-width 제한.
- **Max content width:** 640px (앱 화면), 768px (공개 프로필)
- **Border radius 계층:**
  - `--radius-sm: 0.375rem` (6px) — 버튼, 배지, 인풋
  - `--radius-md: 0.5rem` (8px) — 카드, 드롭다운
  - `--radius-lg: 0.75rem` (12px) — 모달, 시트, 대형 카드
  - `--radius-xl: 1rem` (16px) — 바텀시트
  - **규칙:** 작은 요소일수록 작은 radius. 모든 요소에 같은 radius 금지.

## Motion
- **Approach:** Minimal-functional — 상태 변화를 돕는 것만
- **Easing:** enter → `ease-out`, exit → `ease-in`, move → `ease-in-out`
- **Duration:**
  - micro: 100ms (hover, focus)
  - short: 150ms (버튼 상태)
  - medium: 200ms (모달 등장)
  - long: 300ms (페이지 전환)
- **금지:** `transition: all`, layout 속성(width/height) 애니메이션

## Component 규칙
- **버튼:** primary는 `#292524` bg, `#FAFAF9` 텍스트, `radius-sm`. ghost는 border만.
- **인풋:** border `#E5E0DB`, focus시 `ring-2 ring-primary/30`. placeholder `#6B5E57`.
- **카드:** `border border-border rounded-md` (8px). 그림자 금지 — border로만 구분.
- **배지:** `accent` 색상(`#F5F0EB` / `#292524`) 또는 neutral(`#F6F4F2` / `#6B5E57`).
- **상태 메시지:** success/warning/error/info 각각 배경색 + 좌측 4px solid border.

## Anti-patterns (금지)
- 모든 요소에 같은 border-radius
- 그림자(shadow)로 elevation 표현 — border를 사용할 것
- primary를 배경 전체에 깔기
- `transition: all`
- 카드를 구분 없이 중첩
- 텍스트에 letter-spacing (한글)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-03 | 배경 #F9FAFB → #FFFFFF | 회색빛 배경이 저렴해 보임. 순백 + border로 elevation 표현 |
| 2026-04-03 | accent = primary 제거 | accent는 subtle 오렌지 bg(#FFF3E8)로 분리 |
| 2026-04-03 | destructive-foreground 버그 수정 | #DC2626 → bg, #FFFFFF → fg |
| 2026-04-03 | radius 계층화 | sm/md/lg/xl 명시적 값으로. calc() 의존 제거 |
| 2026-04-03 | dark mode 직접 설계 | oklch 자동생성 제거, elevation 기반 수동 설계 |
| 2026-04-21 | primary #FF6B00 → #292524 (Deep Stone) | 오렌지가 브랜드 톤을 가볍게 만듦. 시공 재료(흙·돌·콘크리트)에서 온 따뜻한 다크 브라운으로 교체. 포트폴리오라는 명칭도 확정 (디지털 명함 표현 폐기). |
