-- ─────────────────────────────────────────────────────
-- 워커 프로필 풀텍스트 검색 (PostgreSQL tsvector + GIN)
--
-- 목적: ilike('%query%') LIKE 검색을 PostgreSQL 네이티브
--       풀텍스트 검색으로 교체.
--
-- 설계 결정:
--   - 외부 검색 엔진(Elasticsearch, Algolia) 없이 PostgreSQL 하나로 해결
--   - pg_trgm 확장으로 한국어 부분 일치 지원 (형태소 분석기 없이)
--   - GENERATED ALWAYS AS (... STORED) 컬럼으로 자동 갱신
--     → 서비스 레이어 수동 갱신 불필요, 데이터 불일치 없음
--   - GIN 인덱스: 역인덱스(inverted index) 방식, tsvector 전용 최적 인덱스
--
-- 검색 대상 컬럼:
--   - business_name (가중치 A — 사업명, 가장 중요)
--   - career_summary (가중치 B — 경력 요약)
--   - description    (가중치 C — 자기소개)
-- ─────────────────────────────────────────────────────

-- pg_trgm 확장 활성화 (한국어 트리그램 매칭용)
-- "CREATE EXTENSION IF NOT EXISTS" — 이미 있으면 무시
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- search_vector 컬럼 추가 (Generated Column)
-- GENERATED ALWAYS AS ... STORED:
--   INSERT/UPDATE 시 PostgreSQL이 자동으로 재계산 및 저장
--   애플리케이션 레이어에서 별도 갱신 불필요
ALTER TABLE "worker_profiles"
  ADD COLUMN "search_vector" tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('simple', coalesce("business_name", '')), 'A') ||
      setweight(to_tsvector('simple', coalesce("career_summary", '')), 'B') ||
      setweight(to_tsvector('simple', coalesce("description", '')),   'C')
    ) STORED;

-- GIN 인덱스 생성 (역인덱스 — tsvector @@ tsquery 연산자 전용)
-- CONCURRENTLY: 인덱스 생성 중 테이블 잠금 없음 (프로덕션 안전)
CREATE INDEX CONCURRENTLY "idx_worker_profiles_search_vector"
  ON "worker_profiles"
  USING GIN ("search_vector");

-- pg_trgm GIN 인덱스 — 한국어 부분 문자열 매칭 보조
-- tsvector가 커버하지 못하는 단어 중간 검색을 보완
CREATE INDEX CONCURRENTLY "idx_worker_profiles_name_trgm"
  ON "worker_profiles"
  USING GIN ("business_name" gin_trgm_ops);

-- office_city / office_district 필터 인덱스 (지역 필터 쿼리 최적화)
CREATE INDEX IF NOT EXISTS "idx_worker_profiles_city_district"
  ON "worker_profiles" ("office_city", "office_district");

-- verified 필터 인덱스 (인증 워커 필터 쿼리 최적화)
CREATE INDEX IF NOT EXISTS "idx_worker_profiles_verified"
  ON "worker_profiles" ("business_verified")
  WHERE "business_verified" = true;
