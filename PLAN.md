<!-- /autoplan restore point: /c/Users/heo/.gstack/projects/jae-tech-bluecollar/main-autoplan-restore-20260416-222305.md -->

# Plan: 전체 UI/UX 디자인 감사 스프린트

**Branch:** main
**Date:** 2026-04-16
**Status:** In Review

---

## Problem Statement

사용자 요청: "전체적인 디자인 점검과 UX 점검이 필요해"

현재 앱은 기능 단위 스프린트로 개발해왔고, 전체 화면을 한번에 통합적으로 본 적이 없음.
각 화면이 개별적으로는 작동하지만, 앱 전체의 일관성·흐름·접근성·피로감을 종합 점검할 필요가 있음.

**점검 대상 화면:**
1. 랜딩 페이지 (`/`) — Navbar, Hero, PortfolioStrip, HowItWorks, ClientCTA, Footer
2. 로그인 페이지 (`/login`) — 소셜/이메일 로그인 카드
3. 온보딩 (`/onboarding`, `/onboarding/slug`, `/onboarding/complete`) — 단계별 폼
4. 워커 공개 프로필 (`/worker/[slug]`) — Identity, portfolio grid, 모달
5. 포트폴리오 상세 모달 (`PortfolioDetailModal`) — 방금 수정된 핵심 컴포넌트
6. 대시보드 (`/dashboard`) — 포트폴리오 탭, 프로필 편집 탭, 설정 탭
7. 포트폴리오 폼 (`/dashboard/portfolio/new`, `/dashboard/portfolio/[id]/edit`) — 사진 업로드 + 메타 정보
8. 검색 (`/search`) — 필터 패널, 결과 카드

**평가 기준:**
- DESIGN.md 준수 (radius 계층, primary 오렌지 사용 원칙, tracking 금지 등)
- 상태 처리 완결성 (loading, empty, error, success)
- 모바일 퍼스트 레이아웃
- 접근성 (keyboard nav, contrast, aria)
- UX 흐름 일관성 (전환, 피드백, 네비게이션)

---

## Scope

### In scope
- 전체 프론트엔드 컴포넌트 시각 감사
- DESIGN.md 준수 체크
- UX 흐름 검토 (온보딩 → 프로필 → 공유 → 재방문)
- 빠진 상태 처리 발견 및 수정

### Not in scope
- API / 백엔드 변경
- 새로운 기능 추가 (기존 TODO만 실행)
- 결제, 알림 등 미구현 섹션

---

## Sub-problems → Existing Code Mapping

| Sub-problem | 파일 |
|-------------|------|
| 랜딩 Hero CTA | `components/hero-section.tsx` |
| 랜딩 네비 | `components/navbar.tsx` |
| 로그인 폼 | `app/login/page.tsx` |
| 온보딩 단계 | `app/onboarding/*.tsx`, `components/onboarding/*.tsx` |
| 공개 프로필 | `app/worker/[slug]/page.tsx` |
| 포트폴리오 모달 | `components/worker/portfolio-detail-modal.tsx` |
| 대시보드 | `app/dashboard/page.tsx` |
| 포트폴리오 폼 | `components/dashboard/portfolio-form.tsx`, `portfolio-add-modal.tsx` |
| 검색 | `app/search/page.tsx`, `components/search/*.tsx` |
| 디자인 시스템 | `DESIGN.md`, `app/globals.css` |

---

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|---------|

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests | 0 | — | — |

**VERDICT:** IN PROGRESS — /autoplan 실행 중
