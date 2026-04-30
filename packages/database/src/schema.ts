import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  pgEnum,
  varchar,
  integer,
  primaryKey,
  numeric,
  date,
  index,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────
// 📌 ENUMS (열거형 정의)
// ─────────────────────────────────────────────────────

/**
 * 사용자 역할
 * - ADMIN: 관리자 (사업자 검증, 건물 정보 관리)
 * - WORKER: 블루칼라 전문가 (포트폴리오 작성, CV 관리)
 * - CLIENT: 고객 (포트폴리오 조회)
 */
export const roleEnum = pgEnum("user_role", ["ADMIN", "WORKER", "CLIENT"]);

/**
 * 사업자 문서 검증 상태
 * - PENDING: 대기 중 (워커가 제출함)
 * - APPROVED: 승인됨 (관리자가 검증 완료)
 * - REJECTED: 거절됨 (재제출 필요)
 */
export const businessDocumentStatusEnum = pgEnum("business_document_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

/**
 * 미디어 타입 (포트폴리오 파일 형식)
 * - IMAGE: 이미지 (JPEG, PNG 등)
 * - VIDEO: 영상 (MP4, WebM 등)
 * - PDF: PDF 문서 (명세서, 견적서 등)
 */
export const mediaTypeEnum = pgEnum("media_type", ["IMAGE", "VIDEO", "PDF"]);

/**
 * 이미지 분류 (포트폴리오 이미지 타입)
 * - BEFORE: 시공 전
 * - AFTER: 시공 후
 * - DETAIL: 상세 샷
 * - BLUEPRINT: 평면도/설계도
 */
export const imageTypeEnum = pgEnum("image_type", [
  "BEFORE",
  "AFTER",
  "DETAIL",
  "BLUEPRINT",
]);

/**
 * 난이도 (포트폴리오 난이도)
 * - EASY: 쉬움
 * - MEDIUM: 보통
 * - HARD: 어려움
 */
export const difficultyEnum = pgEnum("difficulty", ["EASY", "MEDIUM", "HARD"]);

/**
 * 방 유형 (포트폴리오 공간 분류)
 * - LIVING: 거실
 * - BATHROOM: 욕실
 * - KITCHEN: 주방
 * - BEDROOM: 침실
 * - BALCONY: 발코니/베란다
 * - ENTRANCE: 현관
 * - UTILITY: 다용도실
 * - STUDY: 서재/작업실
 * - OTHER: 기타
 */
export const roomTypeEnum = pgEnum("room_type", [
  "LIVING",
  "BATHROOM",
  "KITCHEN",
  "BEDROOM",
  "BALCONY",
  "ENTRANCE",
  "UTILITY",
  "STUDY",
  "OTHER",
]);

/**
 * 비용 공개 여부
 * - PUBLIC: 공개 (누구나 볼 수 있음)
 * - PRIVATE: 비공개 (워커만 볼 수 있음)
 */
export const costVisibilityEnum = pgEnum("cost_visibility", [
  "PUBLIC",
  "PRIVATE",
]);

// ─────────────────────────────────────────────────────
// 1️⃣ USERS & AUTHENTICATION (인증)
// ─────────────────────────────────────────────────────

/**
 * users 테이블 (이메일 중심 인증 시스템)
 *
 * 플랫폼의 모든 사용자(관리자, 워커, 고객) 정보를 관리합니다.
 * ✨ 변경 사항: email을 기본 식별자로 설정하고, SSO 통합 및 휴대폰 검증을 추가했습니다.
 *
 * 인증 전략:
 * - 로컬 가입: email + password (이메일 검증 후 휴대폰 검증 필수)
 * - 소셜 로그인: Google/Kakao OAuth (provider + providerUserId)
 * - 계정 연동: 동일 이메일로 로컬과 소셜 계정 자동 통합
 * - 1인 1계정: 휴대폰 인증 필수로 보장
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // 📧 이메일 관련 필드 (기본 식별자)
    email: text("email").notNull().unique(), // ✨ 기본 식별자로 변경
    emailVerified: boolean("email_verified").default(false).notNull(), // 이메일 검증 여부
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }), // 이메일 검증 완료 시각

    // 📱 휴대폰 관련 필드 (검증 필수, 중복 방지)
    phoneNumber: varchar("phone_number", { length: 20 }).unique(), // ✨ NOT NULL → nullable로 변경
    phoneVerified: boolean("phone_verified").default(false).notNull(), // 휴대폰 검증 여부
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }), // 휴대폰 검증 완료 시각

    // 🔐 비밀번호 (로컬 계정만)
    password: varchar("password", { length: 255 }), // 해시된 비밀번호 (소셜 로그인은 null)

    // 🔗 SSO/소셜 로그인 필드
    provider: text("provider").default("local"), // 'local' | 'google' | 'kakao'
    providerUserId: text("provider_user_id"), // Google ID 또는 Kakao ID

    // 👤 기본 사용자 정보
    realName: text("real_name"), // 실명

    // 📊 계정 상태 관리
    status: text("status").default("ACTIVE"), // 'INACTIVE'(미인증) | 'ACTIVE'(정상) | 'SUSPENDED'(정지) | 'DELETED'(삭제)
    isVerified: boolean("is_verified").default(false).notNull(), // 전체 인증 완료 여부 (deprecated, 향후 제거)

    // 👥 사용자 역할
    role: roleEnum("role").default("CLIENT").notNull(), // 'ADMIN' | 'WORKER' | 'CLIENT'

    // 📜 약관 동의 기록
    termsAgreedAt: timestamp("terms_agreed_at", { withTimezone: true }), // 이용약관 동의 시각
    termsVersion: varchar("terms_version", { length: 20 }), // 동의한 약관 버전 (예: '2026-04')

    // ⏰ 타임스탬프
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // 소프트 삭제 (soft delete) 지원
  },
  (table) => ({
    // ⚡ 성능 인덱스
    emailIdx: index("idx_users_email").on(table.email), // 이메일 조회 최적화
    phoneIdx: index("idx_users_phone").on(table.phoneNumber), // 휴대폰 조회 최적화
    providerIdIdx: index("idx_users_provider_id").on(
      table.provider,
      table.providerUserId,
    ), // SSO 조회 최적화
    createdIdx: index("idx_users_created").on(table.createdAt), // 생성일 기반 조회
  }),
);

/**
 * authCodes 테이블
 *
 * SMS OTP 기반 회원가입 본인 확인용 테이블입니다.
 * 6자리 코드를 10분 유효기한과 함께 저장합니다.
 */
export const authCodes = pgTable(
  "auth_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    code: varchar("code", { length: 6 }).notNull(), // 6자리 인증번호
    isUsed: boolean("is_used").default(false).notNull(), // 사용 여부
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 10분 후 만료
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // 인증 코드 조회 성능 인덱스
    phoneCreatedIdx: index("idx_auth_codes_phone_created").on(
      table.phoneNumber,
      table.createdAt,
    ),
  }),
);

/**
 * refreshTokens 테이블
 *
 * JWT 기반 토큰 인증에서 refresh token을 관리합니다.
 * 토큰 만료, 로그아웃, 토큰 발급 관리를 위해 데이터베이스에 저장합니다.
 */
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: varchar("token", { length: 500 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 토큰 만료 시간 (30일)
    revokedAt: timestamp("revoked_at", { withTimezone: true }), // 로그아웃 시 설정 (만료 전 무효화)
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Refresh token 검증 인덱스
    userIdIdx: index("idx_refresh_tokens_user_id").on(table.userId),
    // 만료된 토큰 정리(cleanup) 인덱스
    expiresAtIdx: index("idx_refresh_tokens_expires").on(table.expiresAt),
  }),
);

/**
 * emailVerificationCodes 테이블 ✨ NEW
 *
 * 이메일 인증 토큰을 관리합니다.
 * 회원가입, 비밀번호 재설정, 이메일 변경 시 사용되는 인증 코드/토큰을 저장합니다.
 *
 * 특징:
 * - code: UUID 또는 6자리 코드 (type에 따라 다름)
 * - type: SIGNUP(가입), PASSWORD_RESET(비밀번호 재설정), EMAIL_CHANGE(이메일 변경)
 * - expiresAt: 24시간 유효기한
 * - isUsed: 토큰 재사용 방지
 */
export const emailVerificationCodes = pgTable(
  "email_verification_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(), // 인증 대상 이메일
    code: varchar("code", { length: 64 }).notNull(), // 토큰 (UUID 또는 6자리 코드)
    type: text("type").notNull(), // 'SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_CHANGE'
    isUsed: boolean("is_used").default(false).notNull(), // 토큰 재사용 방지
    usedAt: timestamp("used_at", { withTimezone: true }), // 토큰 사용 시각 (감시용)
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 24시간 유효
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // ⚡ 성능 인덱스
    emailTypeIdx: index("idx_email_verification_email_type").on(
      table.email,
      table.type,
    ), // 이메일 + 타입별 조회
    expiresAtIdx: index("idx_email_verification_expires").on(table.expiresAt), // 만료된 토큰 정리
  }),
);

/**
 * disposableEmailBlacklist 테이블 ✨ NEW
 *
 * 일회용 이메일(Disposable Email) 도메인 블랙리스트입니다.
 * 임시 메일 서비스(tempmail.com, 10minutemail.com 등)를 차단하여 어뷰징을 방지합니다.
 *
 * 초기 데이터:
 * - 약 2000+ 일회용 이메일 도메인 (public-suffix-list 기반)
 * - 정기적 업데이트 필수 (매월 1회 권장)
 */
export const disposableEmailBlacklist = pgTable(
  "disposable_email_blacklist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domain: text("domain").notNull().unique(), // 'tempmail.com', '10minutemail.com' 등
    category: text("category"), // 'TEMP', 'GUERRILLAMAIL', 'SPAM' 등 (분류용)
    addedAt: timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(), // 추가 일시
  },
  (table) => ({
    // ⚡ 성능 인덱스
    domainIdx: index("idx_disposable_email_domain").on(table.domain), // 도메인 검사 (가입 시)
  }),
);

/**
 * accountLinkingAudit 테이블 ✨ NEW
 *
 * 소셜 계정 연동(Account Linking) 이력을 감시합니다.
 * 보안 감시 및 의심 활동 탐지용 감사 로그입니다.
 *
 * 기록되는 작업:
 * - LINKED: 소셜 계정 연동 (Google/Kakao)
 * - UNLINKED: 소셜 계정 연동 해제
 * - RELINKED: 재연동
 *
 * 감시 정보:
 * - ipAddress: 요청 IP 주소
 * - userAgent: 사용 기기/브라우저 정보
 * - timestamp: 작업 시각
 */
export const accountLinkingAudit = pgTable("account_linking_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(), // 대상 사용자
  provider: text("provider").notNull(), // 소셜 제공자 ('google' | 'kakao')
  providerUserId: text("provider_user_id").notNull(), // 소셜 계정 ID
  action: text("action").notNull(), // 'LINKED' | 'UNLINKED' | 'RELINKED'
  ipAddress: text("ip_address"), // 요청 IP 주소 (의심 활동 탐지용)
  userAgent: text("user_agent"), // 사용자 에이전트 (기기 정보)
  timestamp: timestamp("timestamp", { withTimezone: true })
    .defaultNow()
    .notNull(), // 작업 시각
});

// ─────────────────────────────────────────────────────
// 2️⃣ WORKER PROFILES (워커 프로필 - CV)
// ─────────────────────────────────────────────────────

/**
 * masterCodes 테이블
 *
 * 필드(직종), 지역 등 시스템 전체에서 사용되는 공통 코드를 관리합니다.
 * 예: FLD_TILE(타일), AREA_SEOUL_GN(서울 강남구)
 */
export const masterCodes = pgTable("master_codes", {
  code: varchar("code", { length: 50 }).primaryKey(), // FLD_TILE, AREA_SEOUL_GN 등
  group: varchar("group", { length: 50 }).notNull(), // FIELD, AREA
  name: text("name").notNull(), // 타일, 서울 강남구
  sortOrder: integer("sort_order").default(0),
});

/**
 * workerProfiles 테이블
 *
 * 블루칼라 전문가의 CV 정보를 관리합니다.
 * 회원가입 완료 시 즉시 생성되며, slug를 통해 고유의 포트폴리오 사이트(slug.bluecollar.cv) 운영 가능합니다.
 */
export const workerProfiles = pgTable("worker_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),

  // ▪️ 기본 정보
  slug: varchar("slug", { length: 50 }).notNull().unique(), // slug.bluecollar.cv의 slug 부분
  businessName: text("business_name").notNull(), // 사업명
  profileImageUrl: text("profile_image_url"), // 프로필 사진 (S3 URL)
  description: text("description"), // 자기소개

  // ▪️ 경력 정보
  careerSummary: text("career_summary"), // 경력 요약 (예: "15년 경력 타일 전문가")
  yearsOfExperience: integer("years_of_experience"), // 경력 연수

  // ▪️ 인증 정보
  businessVerified: boolean("business_verified").default(false).notNull(), // 사업자 인증 여부 (뱃지용)

  // ▪️ 사무실 정보 (선택사항)
  // 행정안전부 공공 API(https://business.juso.go.kr)에서 자동 조회
  officeAddress: text("office_address"), // 사무실 주소 (예: "서울 강남구 삼성동 123")
  officeCity: varchar("office_city", { length: 50 }), // 도시 (예: "서울")
  officeDistrict: varchar("office_district", { length: 50 }), // 구 (예: "강남구")
  latitude: numeric("latitude", { precision: 10, scale: 8 }), // 위도 (공공 API에서 자동 획득)
  longitude: numeric("longitude", { precision: 11, scale: 8 }), // 경도 (공공 API에서 자동 획득)
  officePhoneNumber: varchar("office_phone_number", { length: 20 }), // 사무실 연락처
  operatingHours: text("operating_hours"), // 영업시간 (예: "월-금 09:00-18:00, 토 09:00-14:00")
  officeImageUrl: text("office_image_url"), // 사무실 이미지 (S3 URL)

  // ▪️ 타임스탬프
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * workerFields 테이블 (M:N 관계)
 *
 * 워커의 전문 분야를 masterCodes와 연결합니다.
 * 예: 워커 A는 "FLD_TILE"과 "FLD_PAINTING" 두 가지 전문분야
 */
export const workerFields = pgTable(
  "worker_fields",
  {
    workerProfileId: uuid("worker_profile_id")
      .references(() => workerProfiles.id, { onDelete: "cascade" })
      .notNull(),
    fieldCode: varchar("field_code")
      .references(() => masterCodes.code)
      .notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.workerProfileId, t.fieldCode] }) }),
);

/**
 * workerAreas 테이블 (M:N 관계)
 *
 * 워커가 활동 가능한 지역을 masterCodes와 연결합니다.
 * 예: 워커 A는 "AREA_SEOUL_GN"과 "AREA_SEOUL_SC"에서 활동
 */
export const workerAreas = pgTable(
  "worker_areas",
  {
    workerProfileId: uuid("worker_profile_id")
      .references(() => workerProfiles.id, { onDelete: "cascade" })
      .notNull(),
    areaCode: varchar("area_code")
      .references(() => masterCodes.code)
      .notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.workerProfileId, t.areaCode] }) }),
);

// ─────────────────────────────────────────────────────
// 3️⃣ BUSINESS REGISTRATION (사업자 인증 - 선택사항)
// ─────────────────────────────────────────────────────

/**
 * businessDocuments 테이블
 *
 * 워커가 업로드한 사업자등록증을 관리합니다.
 * 선택사항이지만, 업로드 후 관리자 검증을 통해 businessVerified 뱃지를 획득합니다.
 */
export const businessDocuments = pgTable(
  "business_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workerProfileId: uuid("worker_profile_id")
      .references(() => workerProfiles.id, { onDelete: "cascade" })
      .notNull(),

    businessNumber: varchar("business_number", { length: 20 }), // 사업자등록번호 (10자리)
    documentUrl: text("document_url").notNull(), // S3에 저장된 증서 이미지 URL

    status: businessDocumentStatusEnum("status").default("PENDING").notNull(), // 검증 상태
    validationMessage: text("validation_message"), // 검증 메시지

    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(), // 제출 시간
    validatedAt: timestamp("validated_at", { withTimezone: true }), // 검증 완료 시간

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // 관리자 검증 큐 조회 성능 인덱스
    statusSubmittedIdx: index("idx_business_docs_status_submitted").on(
      table.status,
      table.submittedAt,
    ),
  }),
);

/**
 * manualReviews 테이블
 *
 * 관리자가 사업자 문서를 검증한 기록을 남깁니다.
 * 승인 시 workerProfiles.businessVerified = true로 업데이트됩니다.
 */
export const manualReviews = pgTable("manual_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .references(() => businessDocuments.id, { onDelete: "cascade" })
    .notNull(),

  adminId: uuid("admin_id")
    .references(() => users.id)
    .notNull(), // 검증한 관리자

  decision: varchar("decision", { length: 20 }).notNull(), // APPROVED or REJECTED
  reason: text("reason"), // 거절 사유 또는 검토 의견

  reviewedAt: timestamp("reviewed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─────────────────────────────────────────────────────
// 4️⃣ BUILDINGS (건물 정보 - 공공 데이터)
// ─────────────────────────────────────────────────────

/**
 * materials 테이블
 *
 * 자재 라이브러리 — 자유텍스트 태그를 정규화된 자재 ID로 연결합니다.
 * 브랜드 협업, 단가 통계, 검색 정확도 향상의 기반 데이터입니다.
 *
 * 시드 데이터: 타일/바닥재/페인트/도배 등 업계 표준 자재명 ~50개
 * slug: 한국어 이름 기반으로 수동 지정 (충돌 방지)
 */
export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // ▪️ 자재 정보
    name: text("name").notNull(), // 자재명 (예: "포세린 타일", "강화마루")
    category: text("category").notNull(), // 카테고리 (예: "타일", "바닥재", "페인트")
    brandName: text("brand_name"), // 브랜드명 (선택, 예: "LG하우시스", "KCC")
    slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-safe 식별자

    // ▪️ 상태
    isActive: boolean("is_active").default(true).notNull(), // 비활성화 시 검색에서 제외

    // ▪️ 타임스탬프
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // 카테고리별 자재 조회 인덱스
    categoryIdx: index("idx_materials_category").on(table.category),
    // 활성 자재 조회 인덱스
    activeIdx: index("idx_materials_active").on(table.isActive),
  }),
);

/**
 * buildings 테이블
 *
 * 포트폴리오의 시공 사례가 이루어진 건물 정보를 저장합니다.
 * 건물명은 확실한 데이터를 위해 공공 데이터(정부 건물 정보)를 기반으로 관리되며,
 * 사용자는 선택식으로만 입력 가능합니다.
 */
export const buildings = pgTable("buildings", {
  id: uuid("id").primaryKey().defaultRandom(),

  // ▪️ 건물 정보
  buildingName: text("building_name").notNull(), // 래미안 강남
  address: text("address").notNull(), // 서울 강남구 삼성동 xxx-xxx
  city: varchar("city", { length: 50 }).notNull(), // 서울
  district: varchar("district", { length: 50 }).notNull(), // 강남구
  neighborhood: varchar("neighborhood", { length: 50 }), // 삼성동

  // ▪️ 건물 타입
  buildingType: varchar("building_type", { length: 50 }).notNull(), // APARTMENT, OFFICE, HOUSE

  // ▪️ 추가 정보
  yearBuilt: integer("year_built"), // 준공 연도 (예: 2020)

  // ▪️ 공공 데이터 출처
  source: varchar("source", { length: 50 }).notNull(), // GOVERNMENT_DB
  externalId: varchar("external_id").unique(), // 정부 공공 API ID

  // ▪️ 타임스탬프
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─────────────────────────────────────────────────────
// 5️⃣ PORTFOLIO (포트폴리오 - CV 증명, 범용)
// ─────────────────────────────────────────────────────

/**
 * portfolios 테이블
 *
 * 워커의 시공 사례(포트폴리오)를 저장합니다.
 * 모든 블루칼라 직종(타일, 전기, 배관, 도배 등)에서 사용 가능한 범용 구조입니다.
 */
export const portfolios = pgTable(
  "portfolios",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // ▪️ 외래키
    workerProfileId: uuid("worker_profile_id")
      .references(() => workerProfiles.id, { onDelete: "cascade" })
      .notNull(),
    buildingId: uuid("building_id").references(() => buildings.id), // 시공 건물 (공공 DB)

    // ▪️ 기본 정보
    title: text("title").notNull(), // 시공 사례 제목
    content: text("content"), // 상세 설명 (선택, 마크다운 지원 고려)
    location: varchar("location", { length: 200 }), // 시공 위치 (자유텍스트)
    spaceType: varchar("space_type", { length: 50 }), // 'RESIDENTIAL'|'COMMERCIAL'|'OTHER'
    constructionScope: text("construction_scope"), // 시공 범위 상세 설명

    // ▪️ 시공 기간
    startDate: date("start_date"), // 시공 시작일
    endDate: date("end_date"), // 시공 완료일

    // ▪️ 난이도 및 비용
    difficulty: difficultyEnum("difficulty"), // EASY, MEDIUM, HARD
    estimatedCost: numeric("estimated_cost", {
      precision: 12,
      scale: 2,
    }), // 예상 비용
    actualCost: numeric("actual_cost", { precision: 12, scale: 2 }), // 실제 비용
    costVisibility: costVisibilityEnum("cost_visibility").default("PRIVATE"), // 비용 공개 여부

    // ▪️ 통계
    viewCount: integer("view_count").default(0).notNull(), // 포트폴리오 조회수

    // ▪️ 타임스탬프
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // 워커별 포트폴리오 조회 성능 인덱스
    workerCreatedIdx: index("idx_portfolios_worker_created").on(
      table.workerProfileId,
      table.createdAt,
    ),
  }),
);

/**
 * portfolioRooms 테이블
 *
 * 포트폴리오의 공간(방) 분류를 저장합니다.
 * 사진/태그를 특정 방에 연결하여 "욕실만 보기" 같은 필터를 가능하게 합니다.
 *
 * 예: 욕실 리모델링 포트폴리오에 "욕실 1", "욕실 2" 두 개의 방 등록 가능
 * 삭제 시: portfolioMedia.roomId, portfolioTags.roomId → SET NULL (미디어/태그는 보존)
 */
export const portfolioRooms = pgTable(
  "portfolio_rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .references(() => portfolios.id, { onDelete: "cascade" })
      .notNull(),

    // ▪️ 방 정보
    roomType: roomTypeEnum("room_type").notNull(), // LIVING, BATHROOM, KITCHEN 등
    roomLabel: varchar("room_label", { length: 100 }), // 사용자 정의 레이블 (예: "욕실 1", "안방")
    displayOrder: integer("display_order").notNull().default(0), // 정렬 순서

    // ▪️ 타임스탬프
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // 포트폴리오별 방 목록 조회 인덱스
    portfolioOrderIdx: index("idx_portfolio_rooms_portfolio_order").on(
      table.portfolioId,
      table.displayOrder,
    ),
  }),
);

/**
 * portfolioDetails 테이블
 *
 * 포트폴리오의 추가 세부 정보를 저장합니다.
 * 평수, 룸타입, 예산, 작업 설명 등 선택사항 정보입니다.
 */
export const portfolioDetails = pgTable("portfolio_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id")
    .references(() => portfolios.id, { onDelete: "cascade" })
    .notNull()
    .unique(), // UPSERT(onConflictDoUpdate)를 위해 UNIQUE 필수

  // ▪️ 공사 규모 (선택)
  area: numeric("area", { precision: 8, scale: 2 }), // 평수 (84.5 등)
  areaUnit: varchar("area_unit", { length: 10 }), // 'PYEONG' 또는 'SQMETER'
  roomType: varchar("room_type", { length: 50 }), // "2룸", "3룸" (인테리어 전용)

  // ▪️ 보증 기간
  warrantyMonths: integer("warranty_months"), // A/S 보증 기간 (개월, 최대 120)

  // ▪️ 건물 조건 (검색 필터용)
  buildingAge: integer("building_age"), // 건물 연식 (경과 연도, 예: 15 = 15년 된 건물)
  bathroomCount: integer("bathroom_count"), // 욕실 수
  bedroomCount: integer("bedroom_count"), // 침실 수

  // ▪️ 비용 및 기간 (레거시 — 기존 데이터 보존, 신규 폼에서는 미사용)
  budget: text("budget"), // "5,000만원대" (텍스트로 유연성 제공)
  duration: text("duration"), // "3개월" (텍스트로 유연성 제공)

  // ▪️ 상세 내용 (레거시 — constructionScope 컬럼으로 대체)
  workDescription: text("work_description"), // 상세 작업 내용
  materials: text("materials"), // 사용된 자재 (레거시 자유텍스트. 신규는 portfolioTags.materialId 사용)

  // ▪️ 타임스탬프
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * portfolioMedia 테이블
 *
 * 포트폴리오의 모든 미디어(이미지, 비디오, PDF)를 통합 관리합니다.
 * 이미지는 BEFORE/AFTER/DETAIL로 구분하여 시공 과정을 명확히 표현합니다.
 */
export const portfolioMedia = pgTable(
  "portfolio_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .references(() => portfolios.id, { onDelete: "cascade" })
      .notNull(),

    // ▪️ 미디어 정보
    mediaUrl: text("media_url").notNull(), // S3 저장소 URL
    mediaType: mediaTypeEnum("media_type").notNull(), // IMAGE, VIDEO, PDF

    // ▪️ 이미지 타입 (이미지인 경우만)
    imageType: imageTypeEnum("image_type"), // BEFORE, AFTER, DETAIL, BLUEPRINT

    // ▪️ 방 연결 (선택 — 특정 방에 사진을 귀속시킬 때 사용)
    // 방 삭제 시 SET NULL (미디어는 보존, 방 귀속만 해제)
    roomId: uuid("room_id").references(() => portfolioRooms.id, {
      onDelete: "set null",
    }),

    // ▪️ 촬영 일시 (EXIF 메타데이터에서 추출, Phase B에서 자동 추출)
    takenAt: timestamp("taken_at", { withTimezone: true }), // 사진 촬영 시각 (시공 기간 자동 추론에 사용)

    // ▪️ 비디오 추가 정보 (비디오인 경우만)
    videoDuration: integer("video_duration"), // 비디오 길이(초)
    thumbnailUrl: text("thumbnail_url"), // 비디오 썸네일 (S3 URL)

    // ▪️ 기타
    displayOrder: integer("display_order").notNull(), // 정렬 순서
    description: text("description"), // 미디어 설명

    // ▪️ 타임스탬프
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // 포트폴리오 미디어 조회 성능 인덱스
    portfolioOrderIdx: index("idx_portfolio_media_order").on(
      table.portfolioId,
      table.displayOrder,
    ),
  }),
);

/**
 * portfolioTags 테이블
 *
 * 포트폴리오에 사용된 기술, 자재, 도구 등을 태그로 저장합니다.
 * 범용 구조로 모든 블루칼라 직종에 적용 가능합니다.
 * 예: "타일", "대리석", "방수 처리", "배선", "LED 조명" 등
 */
export const portfolioTags = pgTable("portfolio_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id")
    .references(() => portfolios.id, { onDelete: "cascade" })
    .notNull(),

  tagName: text("tag_name").notNull(), // 기술/자재/도구명 (자유텍스트 또는 materials.name과 동기화)
  displayOrder: integer("display_order").notNull(), // 정렬 순서

  // ▪️ 자재 라이브러리 연결 (선택 — 정규화된 자재 ID)
  // materialId가 있으면 구조화된 자재, 없으면 자유텍스트 태그
  materialId: uuid("material_id").references(() => materials.id, {
    onDelete: "set null",
  }),

  // ▪️ 방 연결 (선택 — 공간별 태그 귀속)
  // 방 삭제 시 SET NULL
  roomId: uuid("room_id").references(() => portfolioRooms.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─────────────────────────────────────────────────────
// 6️⃣ WORK SCHEDULES (작업 일정 - 워커 전용)
// ─────────────────────────────────────────────────────

/**
 * workSchedules 테이블
 *
 * 워커(기술자)의 현장 작업 일정을 관리합니다.
 * 날짜 충돌 감지, 포트폴리오 연결(V2) 지원.
 *
 * 충돌 감지 쿼리:
 *   WHERE worker_profile_id = :id
 *     AND start_date <= :newEndDate
 *     AND end_date >= :newStartDate
 *     AND id != :excludeId  -- 수정 시 자기 자신 제외
 */
export const workSchedules = pgTable(
  "work_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // ▪️ 소유자
    workerProfileId: uuid("worker_profile_id")
      .references(() => workerProfiles.id, { onDelete: "cascade" })
      .notNull(),

    // ▪️ 일정 기본 정보
    title: varchar("title", { length: 100 }), // 작업명 (선택)
    siteAddress: varchar("site_address", { length: 200 }).notNull(), // 현장 주소 (필수, V1 자유텍스트)
    fieldCode: varchar("field_code", { length: 50 }).notNull(), // 공정 종류 (FLD_TILE 등, 필수)

    // ▪️ 작업 기간
    startDate: date("start_date").notNull(), // 시작일
    endDate: date("end_date").notNull(), // 종료일 (end_date >= start_date: Zod DTO에서 검증)

    // ▪️ 메모 (선택)
    memo: text("memo"),

    // ▪️ 포트폴리오 연결 (V2 — nullable FK, V1에서는 미사용)
    portfolioId: uuid("portfolio_id").references(() => portfolios.id, {
      onDelete: "set null",
    }),

    // ▪️ 타임스탬프
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // ⚡ 복합 인덱스: 월별 조회 쿼리 (worker_profile_id 필터 + 날짜 범위) 최적화
    workerDatesIdx: index("idx_work_schedules_worker_dates").on(
      table.workerProfileId,
      table.startDate,
      table.endDate,
    ),
  }),
);

// ─────────────────────────────────────────────────────
// 7️⃣ ADMIN (관리자 감사 로그)
// ─────────────────────────────────────────────────────

/**
 * adminAuditLogs 테이블
 *
 * 관리자가 수행한 코드값 변경, 유저 상태 변경 등의 작업 이력을 기록합니다.
 * - action: 수행한 작업 유형 (CODE_CREATE, CODE_UPDATE, CODE_DELETE, USER_STATUS_CHANGE, USER_ROLE_CHANGE)
 * - targetType: 대상 리소스 유형 (master_code, user)
 * - targetId: 대상 리소스의 식별자
 * - before/after: 변경 전후 데이터 (JSONB)
 */
export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // 작업을 수행한 관리자
    adminId: uuid("admin_id")
      .references(() => users.id)
      .notNull(),

    // 작업 유형
    action: varchar("action", { length: 50 }).notNull(),

    // 대상 리소스
    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: varchar("target_id", { length: 100 }).notNull(),

    // 변경 전후 데이터 (JSONB 직렬화)
    before: text("before"), // JSON string
    after: text("after"), // JSON string

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    adminIdx: index("idx_audit_logs_admin").on(table.adminId),
    targetIdx: index("idx_audit_logs_target").on(
      table.targetType,
      table.targetId,
    ),
    createdAtIdx: index("idx_audit_logs_created_at").on(table.createdAt),
    // 관리자별 감사 로그 최신순 조회 복합 인덱스 (adminId 필터 + createdAt 정렬 최적화)
    adminCreatedAtIdx: index("idx_audit_logs_admin_created_at").on(
      table.adminId,
      table.createdAt,
    ),
  }),
);
