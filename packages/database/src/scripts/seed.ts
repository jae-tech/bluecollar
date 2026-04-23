import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  masterCodes,
  workerFields,
  workerAreas,
  materials,
  disposableEmailBlacklist,
} from "../schema";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

async function seed() {
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  console.log("🌱 Starting seed...");

  try {
    // Master Code 데이터
    const seedData = [
      // --- FIELD (업종) --- 반셀프 인테리어 공정 순서 기준 ---
      { code: "FLD_DEMOLITION", group: "FIELD", name: "철거", sortOrder: 1 },
      { code: "FLD_WINDOW", group: "FIELD", name: "샷시/창호", sortOrder: 2 },
      { code: "FLD_PLUMBING", group: "FIELD", name: "설비/배관", sortOrder: 3 },
      { code: "FLD_WATERPROOF", group: "FIELD", name: "방수", sortOrder: 4 },
      { code: "FLD_ELECTRIC", group: "FIELD", name: "전기", sortOrder: 5 },
      { code: "FLD_CARPENTRY", group: "FIELD", name: "목공", sortOrder: 6 },
      { code: "FLD_FILM", group: "FIELD", name: "필름", sortOrder: 7 },
      {
        code: "FLD_PAINTING",
        group: "FIELD",
        name: "도장/페인팅",
        sortOrder: 8,
      },
      { code: "FLD_TILE", group: "FIELD", name: "타일", sortOrder: 9 },
      { code: "FLD_WALLPAPER", group: "FIELD", name: "도배", sortOrder: 10 },
      {
        code: "FLD_FLOORING",
        group: "FIELD",
        name: "장판/마루",
        sortOrder: 11,
      },
      {
        code: "FLD_KITCHEN",
        group: "FIELD",
        name: "주방/싱크대",
        sortOrder: 12,
      },
      {
        code: "FLD_ELASTIC_COAT",
        group: "FIELD",
        name: "탄성코트",
        sortOrder: 13,
      },
      { code: "FLD_BATHROOM", group: "FIELD", name: "욕실", sortOrder: 14 },
      { code: "FLD_CLEANING", group: "FIELD", name: "입주청소", sortOrder: 15 },
      { code: "FLD_GLAZING", group: "FIELD", name: "유리", sortOrder: 16 },
      { code: "FLD_WELDING", group: "FIELD", name: "용접", sortOrder: 17 },
      {
        code: "FLD_MACHINING",
        group: "FIELD",
        name: "기계가공",
        sortOrder: 18,
      },
      // 견적서 기준 추가 직종 (2026-04-21)
      {
        code: "FLD_PLASTER",
        group: "FIELD",
        name: "미장",
        sortOrder: 19,
      },
      {
        code: "FLD_HVAC",
        group: "FIELD",
        name: "에어컨/냉난방",
        sortOrder: 20,
      },
      {
        code: "FLD_FURNITURE",
        group: "FIELD",
        name: "가구/붙박이",
        sortOrder: 21,
      },

      // --- SKILL_TAG (기술 태그) --- 업종별 세부 태그 ---

      // 철거
      {
        code: "TAG_DEMO_FULL",
        group: "SKILL_TAG_FLD_DEMOLITION",
        name: "전체 철거",
        sortOrder: 1,
      },
      {
        code: "TAG_DEMO_PARTIAL",
        group: "SKILL_TAG_FLD_DEMOLITION",
        name: "부분 철거",
        sortOrder: 2,
      },
      {
        code: "TAG_DEMO_BATHROOM",
        group: "SKILL_TAG_FLD_DEMOLITION",
        name: "욕실 철거",
        sortOrder: 3,
      },
      {
        code: "TAG_DEMO_FLOOR",
        group: "SKILL_TAG_FLD_DEMOLITION",
        name: "바닥재 철거",
        sortOrder: 4,
      },
      {
        code: "TAG_DEMO_WALL",
        group: "SKILL_TAG_FLD_DEMOLITION",
        name: "벽체 철거",
        sortOrder: 5,
      },

      // 샷시/창호
      {
        code: "TAG_WIN_REPLACE",
        group: "SKILL_TAG_FLD_WINDOW",
        name: "창호 교체",
        sortOrder: 1,
      },
      {
        code: "TAG_WIN_INSULATION",
        group: "SKILL_TAG_FLD_WINDOW",
        name: "단열 시공",
        sortOrder: 2,
      },
      {
        code: "TAG_WIN_BALCONY",
        group: "SKILL_TAG_FLD_WINDOW",
        name: "베란다 샷시",
        sortOrder: 3,
      },
      {
        code: "TAG_WIN_SLIDING",
        group: "SKILL_TAG_FLD_WINDOW",
        name: "미닫이 창호",
        sortOrder: 4,
      },
      {
        code: "TAG_WIN_SYSTEM",
        group: "SKILL_TAG_FLD_WINDOW",
        name: "시스템 창호",
        sortOrder: 5,
      },

      // 설비/배관
      {
        code: "TAG_PLUMB_WATER",
        group: "SKILL_TAG_FLD_PLUMBING",
        name: "상하수도 배관",
        sortOrder: 1,
      },
      {
        code: "TAG_PLUMB_BOILER",
        group: "SKILL_TAG_FLD_PLUMBING",
        name: "보일러 배관",
        sortOrder: 2,
      },
      {
        code: "TAG_PLUMB_GAS",
        group: "SKILL_TAG_FLD_PLUMBING",
        name: "가스 배관",
        sortOrder: 3,
      },
      {
        code: "TAG_PLUMB_DRAIN",
        group: "SKILL_TAG_FLD_PLUMBING",
        name: "배수 공사",
        sortOrder: 4,
      },
      {
        code: "TAG_PLUMB_RELOCATE",
        group: "SKILL_TAG_FLD_PLUMBING",
        name: "배관 위치 변경",
        sortOrder: 5,
      },

      // 방수
      {
        code: "TAG_WP_BATHROOM",
        group: "SKILL_TAG_FLD_WATERPROOF",
        name: "욕실 방수",
        sortOrder: 1,
      },
      {
        code: "TAG_WP_BALCONY",
        group: "SKILL_TAG_FLD_WATERPROOF",
        name: "베란다 방수",
        sortOrder: 2,
      },
      {
        code: "TAG_WP_ROOF",
        group: "SKILL_TAG_FLD_WATERPROOF",
        name: "옥상 방수",
        sortOrder: 3,
      },
      {
        code: "TAG_WP_LAUNDRY",
        group: "SKILL_TAG_FLD_WATERPROOF",
        name: "세탁실 방수",
        sortOrder: 4,
      },
      {
        code: "TAG_WP_URETHANE",
        group: "SKILL_TAG_FLD_WATERPROOF",
        name: "우레탄 방수",
        sortOrder: 5,
      },

      // 전기
      {
        code: "TAG_ELEC_WIRING",
        group: "SKILL_TAG_FLD_ELECTRIC",
        name: "전기 배선",
        sortOrder: 1,
      },
      {
        code: "TAG_ELEC_PANEL",
        group: "SKILL_TAG_FLD_ELECTRIC",
        name: "분전반 교체",
        sortOrder: 2,
      },
      {
        code: "TAG_ELEC_OUTLET",
        group: "SKILL_TAG_FLD_ELECTRIC",
        name: "콘센트/스위치",
        sortOrder: 3,
      },
      {
        code: "TAG_ELEC_INDUCTION",
        group: "SKILL_TAG_FLD_ELECTRIC",
        name: "인덕션 전용 배선",
        sortOrder: 4,
      },
      {
        code: "TAG_ELEC_LIGHTING",
        group: "SKILL_TAG_FLD_ELECTRIC",
        name: "조명 설치",
        sortOrder: 5,
      },

      // 목공
      {
        code: "TAG_CARP_CEILING",
        group: "SKILL_TAG_FLD_CARPENTRY",
        name: "천장 목공",
        sortOrder: 1,
      },
      {
        code: "TAG_CARP_WALL",
        group: "SKILL_TAG_FLD_CARPENTRY",
        name: "벽체 목공",
        sortOrder: 2,
      },
      {
        code: "TAG_CARP_DOOR",
        group: "SKILL_TAG_FLD_CARPENTRY",
        name: "문틀/문짝",
        sortOrder: 3,
      },
      {
        code: "TAG_CARP_TVBOX",
        group: "SKILL_TAG_FLD_CARPENTRY",
        name: "TV 박스",
        sortOrder: 4,
      },
      {
        code: "TAG_CARP_SKIRTING",
        group: "SKILL_TAG_FLD_CARPENTRY",
        name: "걸레받이",
        sortOrder: 5,
      },
      {
        code: "TAG_CARP_CUSTOM",
        group: "SKILL_TAG_FLD_CARPENTRY",
        name: "붙박이 제작",
        sortOrder: 6,
      },

      // 필름
      {
        code: "TAG_FILM_DOOR",
        group: "SKILL_TAG_FLD_FILM",
        name: "문틀/문짝 필름",
        sortOrder: 1,
      },
      {
        code: "TAG_FILM_MOLDING",
        group: "SKILL_TAG_FLD_FILM",
        name: "몰딩 필름",
        sortOrder: 2,
      },
      {
        code: "TAG_FILM_FURNITURE",
        group: "SKILL_TAG_FLD_FILM",
        name: "가구 필름",
        sortOrder: 3,
      },
      {
        code: "TAG_FILM_WINDOW",
        group: "SKILL_TAG_FLD_FILM",
        name: "창호 필름",
        sortOrder: 4,
      },

      // 도장/페인팅
      {
        code: "TAG_PAINT_CEILING",
        group: "SKILL_TAG_FLD_PAINTING",
        name: "천장 도장",
        sortOrder: 1,
      },
      {
        code: "TAG_PAINT_WALL",
        group: "SKILL_TAG_FLD_PAINTING",
        name: "벽면 도장",
        sortOrder: 2,
      },
      {
        code: "TAG_PAINT_PUTTY",
        group: "SKILL_TAG_FLD_PAINTING",
        name: "퍼티 작업",
        sortOrder: 3,
      },
      {
        code: "TAG_PAINT_EXTERIOR",
        group: "SKILL_TAG_FLD_PAINTING",
        name: "외벽 도장",
        sortOrder: 4,
      },
      {
        code: "TAG_PAINT_SPECIAL",
        group: "SKILL_TAG_FLD_PAINTING",
        name: "특수 도장",
        sortOrder: 5,
      },

      // 타일
      {
        code: "TAG_TILE_BATHROOM",
        group: "SKILL_TAG_FLD_TILE",
        name: "욕실 타일",
        sortOrder: 1,
      },
      {
        code: "TAG_TILE_KITCHEN",
        group: "SKILL_TAG_FLD_TILE",
        name: "주방 타일",
        sortOrder: 2,
      },
      {
        code: "TAG_TILE_FLOOR",
        group: "SKILL_TAG_FLD_TILE",
        name: "바닥 타일",
        sortOrder: 3,
      },
      {
        code: "TAG_TILE_LARGE",
        group: "SKILL_TAG_FLD_TILE",
        name: "대형 타일",
        sortOrder: 4,
      },
      {
        code: "TAG_TILE_REMODEL",
        group: "SKILL_TAG_FLD_TILE",
        name: "덧방 시공",
        sortOrder: 5,
      },

      // 도배
      {
        code: "TAG_WP_FULL",
        group: "SKILL_TAG_FLD_WALLPAPER",
        name: "전체 도배",
        sortOrder: 1,
      },
      {
        code: "TAG_WP_PARTIAL",
        group: "SKILL_TAG_FLD_WALLPAPER",
        name: "부분 도배",
        sortOrder: 2,
      },
      {
        code: "TAG_WP_CEILING_PAPER",
        group: "SKILL_TAG_FLD_WALLPAPER",
        name: "천장 도배",
        sortOrder: 3,
      },
      {
        code: "TAG_WP_FLOAT",
        group: "SKILL_TAG_FLD_WALLPAPER",
        name: "띄움 시공",
        sortOrder: 4,
      },
      {
        code: "TAG_WP_PREMIUM",
        group: "SKILL_TAG_FLD_WALLPAPER",
        name: "고급지 도배",
        sortOrder: 5,
      },

      // 장판/마루
      {
        code: "TAG_FLOOR_VINYL",
        group: "SKILL_TAG_FLD_FLOORING",
        name: "장판 시공",
        sortOrder: 1,
      },
      {
        code: "TAG_FLOOR_WOOD",
        group: "SKILL_TAG_FLD_FLOORING",
        name: "원목 마루",
        sortOrder: 2,
      },
      {
        code: "TAG_FLOOR_ENGINEERING",
        group: "SKILL_TAG_FLD_FLOORING",
        name: "강마루/강화마루",
        sortOrder: 3,
      },
      {
        code: "TAG_FLOOR_STONE",
        group: "SKILL_TAG_FLD_FLOORING",
        name: "대리석/돌",
        sortOrder: 4,
      },

      // 주방/싱크대
      {
        code: "TAG_KITCHEN_SINK",
        group: "SKILL_TAG_FLD_KITCHEN",
        name: "싱크대 설치",
        sortOrder: 1,
      },
      {
        code: "TAG_KITCHEN_BUILTIN",
        group: "SKILL_TAG_FLD_KITCHEN",
        name: "빌트인 가전",
        sortOrder: 2,
      },
      {
        code: "TAG_KITCHEN_COUNTER",
        group: "SKILL_TAG_FLD_KITCHEN",
        name: "상부장/하부장",
        sortOrder: 3,
      },
      {
        code: "TAG_KITCHEN_ISLAND",
        group: "SKILL_TAG_FLD_KITCHEN",
        name: "아일랜드 키친",
        sortOrder: 4,
      },

      // 탄성코트
      {
        code: "TAG_EC_BALCONY",
        group: "SKILL_TAG_FLD_ELASTIC_COAT",
        name: "베란다 탄성코트",
        sortOrder: 1,
      },
      {
        code: "TAG_EC_EXTERIOR",
        group: "SKILL_TAG_FLD_ELASTIC_COAT",
        name: "외벽 탄성코트",
        sortOrder: 2,
      },
      {
        code: "TAG_EC_ROOF",
        group: "SKILL_TAG_FLD_ELASTIC_COAT",
        name: "옥상 탄성코트",
        sortOrder: 3,
      },

      // 욕실
      {
        code: "TAG_BATH_FULL",
        group: "SKILL_TAG_FLD_BATHROOM",
        name: "욕실 전체 공사",
        sortOrder: 1,
      },
      {
        code: "TAG_BATH_VANITY",
        group: "SKILL_TAG_FLD_BATHROOM",
        name: "세면대/양변기",
        sortOrder: 2,
      },
      {
        code: "TAG_BATH_SHOWER",
        group: "SKILL_TAG_FLD_BATHROOM",
        name: "샤워부스",
        sortOrder: 3,
      },
      {
        code: "TAG_BATH_ACCESSORY",
        group: "SKILL_TAG_FLD_BATHROOM",
        name: "욕실 액세서리",
        sortOrder: 4,
      },

      // 입주청소
      {
        code: "TAG_CLEAN_MOVEIN",
        group: "SKILL_TAG_FLD_CLEANING",
        name: "입주 청소",
        sortOrder: 1,
      },
      {
        code: "TAG_CLEAN_SPECIAL",
        group: "SKILL_TAG_FLD_CLEANING",
        name: "특수 청소",
        sortOrder: 2,
      },
      {
        code: "TAG_CLEAN_WINDOW",
        group: "SKILL_TAG_FLD_CLEANING",
        name: "유리/창문 청소",
        sortOrder: 3,
      },

      // 유리
      {
        code: "TAG_GLASS_PARTITION",
        group: "SKILL_TAG_FLD_GLAZING",
        name: "유리 파티션",
        sortOrder: 1,
      },
      {
        code: "TAG_GLASS_DOOR",
        group: "SKILL_TAG_FLD_GLAZING",
        name: "유리문",
        sortOrder: 2,
      },
      {
        code: "TAG_GLASS_SAFETY",
        group: "SKILL_TAG_FLD_GLAZING",
        name: "안전유리",
        sortOrder: 3,
      },
      {
        code: "TAG_GLASS_FILM",
        group: "SKILL_TAG_FLD_GLAZING",
        name: "유리 필름",
        sortOrder: 4,
      },

      // 용접
      {
        code: "TAG_WELD_ARC",
        group: "SKILL_TAG_FLD_WELDING",
        name: "아크 용접",
        sortOrder: 1,
      },
      {
        code: "TAG_WELD_MIG",
        group: "SKILL_TAG_FLD_WELDING",
        name: "MIG 용접",
        sortOrder: 2,
      },
      {
        code: "TAG_WELD_TIG",
        group: "SKILL_TAG_FLD_WELDING",
        name: "TIG 용접",
        sortOrder: 3,
      },
      {
        code: "TAG_WELD_STAINLESS",
        group: "SKILL_TAG_FLD_WELDING",
        name: "스테인리스 용접",
        sortOrder: 4,
      },

      // 기계가공
      {
        code: "TAG_MACH_CNC",
        group: "SKILL_TAG_FLD_MACHINING",
        name: "CNC 가공",
        sortOrder: 1,
      },
      {
        code: "TAG_MACH_LATHE",
        group: "SKILL_TAG_FLD_MACHINING",
        name: "선반 가공",
        sortOrder: 2,
      },
      {
        code: "TAG_MACH_MILLING",
        group: "SKILL_TAG_FLD_MACHINING",
        name: "밀링 가공",
        sortOrder: 3,
      },
      {
        code: "TAG_MACH_GRIND",
        group: "SKILL_TAG_FLD_MACHINING",
        name: "연삭 가공",
        sortOrder: 4,
      },

      // 미장
      {
        code: "TAG_PLASTER_CEMENT",
        group: "SKILL_TAG_FLD_PLASTER",
        name: "시멘트 미장",
        sortOrder: 1,
      },
      {
        code: "TAG_PLASTER_SELF_LEVEL",
        group: "SKILL_TAG_FLD_PLASTER",
        name: "셀프레벨링",
        sortOrder: 2,
      },
      {
        code: "TAG_PLASTER_FLOOR_FLAT",
        group: "SKILL_TAG_FLD_PLASTER",
        name: "바닥 평탄화",
        sortOrder: 3,
      },
      {
        code: "TAG_PLASTER_WALL",
        group: "SKILL_TAG_FLD_PLASTER",
        name: "벽면 미장",
        sortOrder: 4,
      },
      {
        code: "TAG_PLASTER_EPOXY_GROUT",
        group: "SKILL_TAG_FLD_PLASTER",
        name: "에폭시 줄눈",
        sortOrder: 5,
      },

      // 에어컨/냉난방
      {
        code: "TAG_HVAC_SYSTEM_AC",
        group: "SKILL_TAG_FLD_HVAC",
        name: "시스템 에어컨 설치",
        sortOrder: 1,
      },
      {
        code: "TAG_HVAC_DUCT",
        group: "SKILL_TAG_FLD_HVAC",
        name: "덕트 공사",
        sortOrder: 2,
      },
      {
        code: "TAG_HVAC_SPLIT",
        group: "SKILL_TAG_FLD_HVAC",
        name: "스탠드/벽걸이 에어컨",
        sortOrder: 3,
      },
      {
        code: "TAG_HVAC_VENTILATION",
        group: "SKILL_TAG_FLD_HVAC",
        name: "환기 시스템",
        sortOrder: 4,
      },
      {
        code: "TAG_HVAC_FAN",
        group: "SKILL_TAG_FLD_HVAC",
        name: "환풍기 설치",
        sortOrder: 5,
      },

      // 가구/붙박이
      {
        code: "TAG_FURN_BUILTIN",
        group: "SKILL_TAG_FLD_FURNITURE",
        name: "붙박이장",
        sortOrder: 1,
      },
      {
        code: "TAG_FURN_SHOE",
        group: "SKILL_TAG_FLD_FURNITURE",
        name: "신발장",
        sortOrder: 2,
      },
      {
        code: "TAG_FURN_KITCHEN",
        group: "SKILL_TAG_FLD_FURNITURE",
        name: "주방 가구/싱크대",
        sortOrder: 3,
      },
      {
        code: "TAG_FURN_FRIDGE_PANEL",
        group: "SKILL_TAG_FLD_FURNITURE",
        name: "냉장고장",
        sortOrder: 4,
      },
      {
        code: "TAG_FURN_CUSTOM",
        group: "SKILL_TAG_FLD_FURNITURE",
        name: "맞춤 가구 제작",
        sortOrder: 5,
      },

      // 목공 추가 태그 (견적서 기준 누락 항목)
      {
        code: "TAG_CARP_PARTITION",
        group: "SKILL_TAG_FLD_CARPENTRY",
        name: "가벽 신설",
        sortOrder: 7,
      },
      {
        code: "TAG_CARP_LIGHTBOX",
        group: "SKILL_TAG_FLD_CARPENTRY",
        name: "등박스",
        sortOrder: 8,
      },
      {
        code: "TAG_CARP_TV_WALL",
        group: "SKILL_TAG_FLD_CARPENTRY",
        name: "TV 매립벽",
        sortOrder: 9,
      },

      // 창호 추가 태그 (견적서 기준 누락 항목)
      {
        code: "TAG_WIN_TURNING",
        group: "SKILL_TAG_FLD_WINDOW",
        name: "터닝도어",
        sortOrder: 6,
      },
      {
        code: "TAG_WIN_INNER",
        group: "SKILL_TAG_FLD_WINDOW",
        name: "내창",
        sortOrder: 7,
      },

      // 욕실 추가 태그 (견적서 기준 누락 항목)
      {
        code: "TAG_BATH_CEILING",
        group: "SKILL_TAG_FLD_BATHROOM",
        name: "욕실 천장재",
        sortOrder: 5,
      },
      {
        code: "TAG_BATH_FAN",
        group: "SKILL_TAG_FLD_BATHROOM",
        name: "환풍기 설치",
        sortOrder: 6,
      },

      // 마감 (실리콘/줄눈 — FLD_CLEANING에 추가)
      {
        code: "TAG_CLEAN_SILICON",
        group: "SKILL_TAG_FLD_CLEANING",
        name: "실리콘 마감",
        sortOrder: 4,
      },
      {
        code: "TAG_CLEAN_GROUT",
        group: "SKILL_TAG_FLD_CLEANING",
        name: "줄눈 마감",
        sortOrder: 5,
      },
      {
        code: "TAG_CLEAN_DOORLOCK",
        group: "SKILL_TAG_FLD_CLEANING",
        name: "도어락/인터폰 설치",
        sortOrder: 6,
      },

      // --- MATERIAL_CAT (자재 카테고리) ---
      {
        code: "MAT_TILE",
        group: "MATERIAL_CAT",
        name: "타일",
        sortOrder: 1,
      },
      {
        code: "MAT_FLOORING",
        group: "MATERIAL_CAT",
        name: "바닥재",
        sortOrder: 2,
      },
      {
        code: "MAT_PAINT",
        group: "MATERIAL_CAT",
        name: "페인트",
        sortOrder: 3,
      },
      {
        code: "MAT_WALLPAPER",
        group: "MATERIAL_CAT",
        name: "도배",
        sortOrder: 4,
      },
      {
        code: "MAT_SANITARY",
        group: "MATERIAL_CAT",
        name: "위생도기",
        sortOrder: 5,
      },
      {
        code: "MAT_WINDOW",
        group: "MATERIAL_CAT",
        name: "창호",
        sortOrder: 6,
      },
      {
        code: "MAT_ADHESIVE",
        group: "MATERIAL_CAT",
        name: "줄눈/접착제",
        sortOrder: 7,
      },
      {
        code: "MAT_OTHER",
        group: "MATERIAL_CAT",
        name: "기타 자재",
        sortOrder: 8,
      },

      // --- EXP (숙련도) ---
      { code: "EXP_1TO3", group: "EXP", name: "1~3년", sortOrder: 1 },
      { code: "EXP_3TO5", group: "EXP", name: "3~5년", sortOrder: 2 },
      { code: "EXP_5TO10", group: "EXP", name: "5~10년", sortOrder: 3 },
      { code: "EXP_10PLUS", group: "EXP", name: "10년 이상", sortOrder: 4 },

      // --- BIZ (사업자 유형) ---
      { code: "BIZ_INDIVIDUAL", group: "BIZ", name: "개인", sortOrder: 1 },
      { code: "BIZ_SOLE", group: "BIZ", name: "개인사업자", sortOrder: 2 },
      { code: "BIZ_CORPORATE", group: "BIZ", name: "법인사업자", sortOrder: 3 },

      // --- AREA (지역) --- 전국구 ---

      // 서울 25구 (sortOrder 101~125)
      {
        code: "AREA_SEOUL_GN",
        group: "AREA",
        name: "서울 강남구",
        sortOrder: 101,
      },
      {
        code: "AREA_SEOUL_SC",
        group: "AREA",
        name: "서울 서초구",
        sortOrder: 102,
      },
      {
        code: "AREA_SEOUL_SP",
        group: "AREA",
        name: "서울 송파구",
        sortOrder: 103,
      },
      {
        code: "AREA_SEOUL_GD",
        group: "AREA",
        name: "서울 강동구",
        sortOrder: 104,
      },
      {
        code: "AREA_SEOUL_JG",
        group: "AREA",
        name: "서울 중구",
        sortOrder: 105,
      },
      {
        code: "AREA_SEOUL_JO",
        group: "AREA",
        name: "서울 종로구",
        sortOrder: 106,
      },
      {
        code: "AREA_SEOUL_YL",
        group: "AREA",
        name: "서울 영등포구",
        sortOrder: 107,
      },
      {
        code: "AREA_SEOUL_MS",
        group: "AREA",
        name: "서울 마포구",
        sortOrder: 108,
      },
      {
        code: "AREA_SEOUL_YC",
        group: "AREA",
        name: "서울 용산구",
        sortOrder: 109,
      },
      {
        code: "AREA_SEOUL_SB",
        group: "AREA",
        name: "서울 서대문구",
        sortOrder: 110,
      },
      {
        code: "AREA_SEOUL_EJ",
        group: "AREA",
        name: "서울 은평구",
        sortOrder: 111,
      },
      {
        code: "AREA_SEOUL_DJ",
        group: "AREA",
        name: "서울 동작구",
        sortOrder: 112,
      },
      {
        code: "AREA_SEOUL_GS",
        group: "AREA",
        name: "서울 관악구",
        sortOrder: 113,
      },
      {
        code: "AREA_SEOUL_GB",
        group: "AREA",
        name: "서울 강북구",
        sortOrder: 114,
      },
      {
        code: "AREA_SEOUL_SR",
        group: "AREA",
        name: "서울 성북구",
        sortOrder: 115,
      },
      {
        code: "AREA_SEOUL_DB",
        group: "AREA",
        name: "서울 도봉구",
        sortOrder: 116,
      },
      {
        code: "AREA_SEOUL_NW",
        group: "AREA",
        name: "서울 노원구",
        sortOrder: 117,
      },
      {
        code: "AREA_SEOUL_JN",
        group: "AREA",
        name: "서울 중랑구",
        sortOrder: 118,
      },
      {
        code: "AREA_SEOUL_GJ",
        group: "AREA",
        name: "서울 광진구",
        sortOrder: 119,
      },
      {
        code: "AREA_SEOUL_SD",
        group: "AREA",
        name: "서울 성동구",
        sortOrder: 120,
      },
      {
        code: "AREA_SEOUL_DP",
        group: "AREA",
        name: "서울 동대문구",
        sortOrder: 121,
      },
      {
        code: "AREA_SEOUL_YS",
        group: "AREA",
        name: "서울 양천구",
        sortOrder: 122,
      },
      {
        code: "AREA_SEOUL_GC",
        group: "AREA",
        name: "서울 강서구",
        sortOrder: 123,
      },
      {
        code: "AREA_SEOUL_GR",
        group: "AREA",
        name: "서울 구로구",
        sortOrder: 124,
      },
      {
        code: "AREA_SEOUL_GG",
        group: "AREA",
        name: "서울 금천구",
        sortOrder: 125,
      },

      // 경기 주요 15개 시 (sortOrder 201~215)
      {
        code: "AREA_GG_SUWON",
        group: "AREA",
        name: "경기 수원시",
        sortOrder: 201,
      },
      {
        code: "AREA_GG_SEONGNAM",
        group: "AREA",
        name: "경기 성남시",
        sortOrder: 202,
      },
      {
        code: "AREA_GG_YONGIN",
        group: "AREA",
        name: "경기 용인시",
        sortOrder: 203,
      },
      {
        code: "AREA_GG_GOYANG",
        group: "AREA",
        name: "경기 고양시",
        sortOrder: 204,
      },
      {
        code: "AREA_GG_HWASEONG",
        group: "AREA",
        name: "경기 화성시",
        sortOrder: 205,
      },
      {
        code: "AREA_GG_BUCHEON",
        group: "AREA",
        name: "경기 부천시",
        sortOrder: 206,
      },
      {
        code: "AREA_GG_NAMYANGJU",
        group: "AREA",
        name: "경기 남양주시",
        sortOrder: 207,
      },
      {
        code: "AREA_GG_ANSAN",
        group: "AREA",
        name: "경기 안산시",
        sortOrder: 208,
      },
      {
        code: "AREA_GG_PYEONGTAEK",
        group: "AREA",
        name: "경기 평택시",
        sortOrder: 209,
      },
      {
        code: "AREA_GG_ANYANG",
        group: "AREA",
        name: "경기 안양시",
        sortOrder: 210,
      },
      {
        code: "AREA_GG_SIHEUNG",
        group: "AREA",
        name: "경기 시흥시",
        sortOrder: 211,
      },
      {
        code: "AREA_GG_GIMPO",
        group: "AREA",
        name: "경기 김포시",
        sortOrder: 212,
      },
      {
        code: "AREA_GG_UIJEONGBU",
        group: "AREA",
        name: "경기 의정부시",
        sortOrder: 213,
      },
      {
        code: "AREA_GG_HANAM",
        group: "AREA",
        name: "경기 하남시",
        sortOrder: 214,
      },
      {
        code: "AREA_GG_GWANGJU",
        group: "AREA",
        name: "경기 광주시",
        sortOrder: 215,
      },

      // 인천 주요 구 (sortOrder 301~305)
      {
        code: "AREA_IC_NAMDONG",
        group: "AREA",
        name: "인천 남동구",
        sortOrder: 301,
      },
      {
        code: "AREA_IC_BUPYEONG",
        group: "AREA",
        name: "인천 부평구",
        sortOrder: 302,
      },
      {
        code: "AREA_IC_SEOGU",
        group: "AREA",
        name: "인천 서구",
        sortOrder: 303,
      },
      {
        code: "AREA_IC_YEONSU",
        group: "AREA",
        name: "인천 연수구",
        sortOrder: 304,
      },
      {
        code: "AREA_IC_MICHUHOL",
        group: "AREA",
        name: "인천 미추홀구",
        sortOrder: 305,
      },

      // 부산 주요 구 (sortOrder 401~406)
      {
        code: "AREA_BS_HAEUNDAE",
        group: "AREA",
        name: "부산 해운대구",
        sortOrder: 401,
      },
      {
        code: "AREA_BS_BUSANJIN",
        group: "AREA",
        name: "부산 부산진구",
        sortOrder: 402,
      },
      {
        code: "AREA_BS_SAHA",
        group: "AREA",
        name: "부산 사하구",
        sortOrder: 403,
      },
      {
        code: "AREA_BS_DONGNAE",
        group: "AREA",
        name: "부산 동래구",
        sortOrder: 404,
      },
      {
        code: "AREA_BS_GEUMJEONG",
        group: "AREA",
        name: "부산 금정구",
        sortOrder: 405,
      },
      {
        code: "AREA_BS_YEONJE",
        group: "AREA",
        name: "부산 연제구",
        sortOrder: 406,
      },

      // 대구 주요 구 (sortOrder 501~504)
      {
        code: "AREA_DG_DALSEO",
        group: "AREA",
        name: "대구 달서구",
        sortOrder: 501,
      },
      {
        code: "AREA_DG_BUKGU",
        group: "AREA",
        name: "대구 북구",
        sortOrder: 502,
      },
      {
        code: "AREA_DG_SUSEONG",
        group: "AREA",
        name: "대구 수성구",
        sortOrder: 503,
      },
      {
        code: "AREA_DG_DONGGU",
        group: "AREA",
        name: "대구 동구",
        sortOrder: 504,
      },

      // 대전 주요 구 (sortOrder 601~604)
      {
        code: "AREA_DJ_SEOGU",
        group: "AREA",
        name: "대전 서구",
        sortOrder: 601,
      },
      {
        code: "AREA_DJ_YUSEONG",
        group: "AREA",
        name: "대전 유성구",
        sortOrder: 602,
      },
      {
        code: "AREA_DJ_DONGGU",
        group: "AREA",
        name: "대전 동구",
        sortOrder: 603,
      },
      {
        code: "AREA_DJ_JOONGGU",
        group: "AREA",
        name: "대전 중구",
        sortOrder: 604,
      },

      // 광주 주요 구 (sortOrder 701~703)
      {
        code: "AREA_GJ_SEOGU",
        group: "AREA",
        name: "광주 서구",
        sortOrder: 701,
      },
      {
        code: "AREA_GJ_BUKGU",
        group: "AREA",
        name: "광주 북구",
        sortOrder: 702,
      },
      {
        code: "AREA_GJ_GWANGSAN",
        group: "AREA",
        name: "광주 광산구",
        sortOrder: 703,
      },

      // 울산 주요 구 (sortOrder 801~803)
      {
        code: "AREA_US_NAMGU",
        group: "AREA",
        name: "울산 남구",
        sortOrder: 801,
      },
      {
        code: "AREA_US_BUKGU",
        group: "AREA",
        name: "울산 북구",
        sortOrder: 802,
      },
      {
        code: "AREA_US_ULJU",
        group: "AREA",
        name: "울산 울주군",
        sortOrder: 803,
      },

      // 세종 (sortOrder 901)
      {
        code: "AREA_SJ_SEJONG",
        group: "AREA",
        name: "세종특별자치시",
        sortOrder: 901,
      },
    ];

    // 기존 데이터 삭제 (FK 참조 테이블 먼저 삭제 후 master_codes 삭제)
    await db.delete(workerFields).execute();
    await db.delete(workerAreas).execute();
    await db.delete(masterCodes).execute();
    console.log("✓ Cleared existing master codes");

    // 새로운 데이터 삽입
    await db.insert(masterCodes).values(seedData).execute();
    console.log(`✓ Inserted ${seedData.length} master codes`);

    // 결과 확인
    const result = await db.select().from(masterCodes).execute();
    const fieldCount = result.filter((r) => r.group === "FIELD").length;
    const skillTagCount = result.filter((r) =>
      r.group.startsWith("SKILL_TAG_"),
    ).length;
    const areaCount = result.filter((r) => r.group === "AREA").length;
    const expCount = result.filter((r) => r.group === "EXP").length;
    const bizCount = result.filter((r) => r.group === "BIZ").length;

    console.log("\n📊 Seeded Master Codes Summary:");
    console.log(`  - FIELD: ${fieldCount}`);
    console.log(`  - SKILL_TAG: ${skillTagCount}`);
    console.log(`  - AREA: ${areaCount}`);
    console.log(`  - EXP: ${expCount}`);
    console.log(`  - BIZ: ${bizCount}`);
    console.log(`  - Total: ${result.length}\n`);

    // ─────────────────────────────────────────────────
    // 자재 라이브러리 시드 데이터
    // ─────────────────────────────────────────────────
    const materialsSeedData = [
      // --- 타일 (20개) ---
      { name: "포세린 타일", category: "MAT_TILE", slug: "porcelain-tile" },
      { name: "세라믹 타일", category: "MAT_TILE", slug: "ceramic-tile" },
      { name: "자연석 타일", category: "MAT_TILE", slug: "natural-stone-tile" },
      { name: "대리석 타일", category: "MAT_TILE", slug: "marble-tile" },
      { name: "모자이크 타일", category: "MAT_TILE", slug: "mosaic-tile" },
      { name: "테라코타 타일", category: "MAT_TILE", slug: "terracotta-tile" },
      { name: "슬레이트 타일", category: "MAT_TILE", slug: "slate-tile" },
      { name: "우드 타일", category: "MAT_TILE", slug: "wood-tile" },
      { name: "메탈 타일", category: "MAT_TILE", slug: "metal-tile" },
      { name: "유리 타일", category: "MAT_TILE", slug: "glass-tile" },
      {
        name: "대형 포세린 (60×120)",
        category: "MAT_TILE",
        slug: "large-porcelain-60x120",
      },
      { name: "헤링본 타일", category: "MAT_TILE", slug: "herringbone-tile" },
      { name: "육각 타일", category: "MAT_TILE", slug: "hexagon-tile" },
      { name: "줄눈 타일", category: "MAT_TILE", slug: "grout-tile" },
      {
        name: "욕실 바닥 논슬립 타일",
        category: "MAT_TILE",
        slug: "non-slip-floor-tile",
      },
      { name: "외벽 타일", category: "MAT_TILE", slug: "exterior-wall-tile" },
      { name: "현관 타일", category: "MAT_TILE", slug: "entrance-tile" },
      { name: "수영장 타일", category: "MAT_TILE", slug: "pool-tile" },
      {
        name: "인테리어 벽 타일",
        category: "MAT_TILE",
        slug: "interior-wall-tile",
      },
      {
        name: "주방 앞치마 타일",
        category: "MAT_TILE",
        slug: "kitchen-backsplash-tile",
      },

      // --- 바닥재 (15개) ---
      { name: "강화마루", category: "MAT_FLOORING", slug: "laminate-flooring" },
      { name: "합판마루", category: "MAT_FLOORING", slug: "plywood-flooring" },
      {
        name: "원목마루",
        category: "MAT_FLOORING",
        slug: "solid-wood-flooring",
      },
      { name: "PVC 장판", category: "MAT_FLOORING", slug: "pvc-vinyl-floor" },
      { name: "LVT 바닥재", category: "MAT_FLOORING", slug: "lvt-flooring" },
      { name: "카펫", category: "MAT_FLOORING", slug: "carpet" },
      {
        name: "코르크 바닥재",
        category: "MAT_FLOORING",
        slug: "cork-flooring",
      },
      {
        name: "대나무 마루",
        category: "MAT_FLOORING",
        slug: "bamboo-flooring",
      },
      {
        name: "에폭시 바닥재",
        category: "MAT_FLOORING",
        slug: "epoxy-flooring",
      },
      {
        name: "고무 바닥재",
        category: "MAT_FLOORING",
        slug: "rubber-flooring",
      },
      {
        name: "자기질 바닥 타일",
        category: "MAT_FLOORING",
        slug: "porcelain-floor-tile",
      },
      { name: "온돌 마루", category: "MAT_FLOORING", slug: "ondol-flooring" },
      {
        name: "방수 바닥재",
        category: "MAT_FLOORING",
        slug: "waterproof-flooring",
      },
      { name: "SPC 바닥재", category: "MAT_FLOORING", slug: "spc-flooring" },
      {
        name: "셀프레벨링 바닥재",
        category: "MAT_FLOORING",
        slug: "self-leveling-floor",
      },

      // --- 페인트 (10개) ---
      {
        name: "수성 페인트",
        category: "MAT_PAINT",
        slug: "water-based-paint",
      },
      { name: "유성 페인트", category: "MAT_PAINT", slug: "oil-based-paint" },
      { name: "에나멜 페인트", category: "MAT_PAINT", slug: "enamel-paint" },
      {
        name: "탄성 방수 페인트",
        category: "MAT_PAINT",
        slug: "elastic-waterproof-paint",
      },
      { name: "실리콘 페인트", category: "MAT_PAINT", slug: "silicone-paint" },
      { name: "에폭시 페인트", category: "MAT_PAINT", slug: "epoxy-paint" },
      { name: "천장 페인트", category: "MAT_PAINT", slug: "ceiling-paint" },
      { name: "외벽 페인트", category: "MAT_PAINT", slug: "exterior-paint" },
      { name: "방청 페인트", category: "MAT_PAINT", slug: "anti-rust-paint" },
      {
        name: "내화 페인트",
        category: "MAT_PAINT",
        slug: "fire-resistant-paint",
      },

      // --- 도배 (10개) ---
      { name: "합지 벽지", category: "MAT_WALLPAPER", slug: "paper-wallpaper" },
      { name: "실크 벽지", category: "MAT_WALLPAPER", slug: "silk-wallpaper" },
      { name: "PVC 벽지", category: "MAT_WALLPAPER", slug: "pvc-wallpaper" },
      {
        name: "패브릭 벽지",
        category: "MAT_WALLPAPER",
        slug: "fabric-wallpaper",
      },
      {
        name: "천연 소재 벽지",
        category: "MAT_WALLPAPER",
        slug: "natural-wallpaper",
      },
      {
        name: "유리섬유 벽지",
        category: "MAT_WALLPAPER",
        slug: "fiberglass-wallpaper",
      },
      {
        name: "방음 벽지",
        category: "MAT_WALLPAPER",
        slug: "soundproof-wallpaper",
      },
      {
        name: "방습 벽지",
        category: "MAT_WALLPAPER",
        slug: "moisture-resistant-wallpaper",
      },
      {
        name: "단열 벽지",
        category: "MAT_WALLPAPER",
        slug: "insulating-wallpaper",
      },
      { name: "폼 벽지", category: "MAT_WALLPAPER", slug: "foam-wallpaper" },

      // --- 위생도기 (10개) ---
      { name: "양변기", category: "MAT_SANITARY", slug: "toilet" },
      { name: "비데", category: "MAT_SANITARY", slug: "bidet" },
      { name: "세면대", category: "MAT_SANITARY", slug: "washbasin" },
      { name: "욕조", category: "MAT_SANITARY", slug: "bathtub" },
      { name: "샤워부스", category: "MAT_SANITARY", slug: "shower-booth" },
      {
        name: "파우더룸 세면대",
        category: "MAT_SANITARY",
        slug: "powder-room-sink",
      },
      { name: "소변기", category: "MAT_SANITARY", slug: "urinal" },
      { name: "수전 세트", category: "MAT_SANITARY", slug: "faucet-set" },
      {
        name: "욕실 악세서리 세트",
        category: "MAT_SANITARY",
        slug: "bathroom-accessory-set",
      },
      { name: "거울 수납장", category: "MAT_SANITARY", slug: "mirror-cabinet" },

      // --- 창호 (8개) ---
      { name: "PVC 창호", category: "MAT_WINDOW", slug: "pvc-window" },
      {
        name: "알루미늄 창호",
        category: "MAT_WINDOW",
        slug: "aluminum-window",
      },
      { name: "시스템 창호", category: "MAT_WINDOW", slug: "system-window" },
      { name: "이중창", category: "MAT_WINDOW", slug: "double-window" },
      { name: "발코니 샷시", category: "MAT_WINDOW", slug: "balcony-sash" },
      { name: "단열 유리", category: "MAT_WINDOW", slug: "insulated-glass" },
      { name: "로이 유리", category: "MAT_WINDOW", slug: "low-e-glass" },
      { name: "방범창", category: "MAT_WINDOW", slug: "security-window" },

      // --- 줄눈/접착제 (2개) ---
      {
        name: "줄눈 시공제",
        category: "MAT_ADHESIVE",
        slug: "grout-compound",
      },
      { name: "타일 접착제", category: "MAT_ADHESIVE", slug: "tile-adhesive" },

      // --- 기타 자재 (5개) ---
      { name: "방수 시트", category: "MAT_OTHER", slug: "waterproof-sheet" },
      {
        name: "단열재 (압출법 보온판)",
        category: "MAT_OTHER",
        slug: "xps-insulation",
      },
      { name: "석고보드", category: "MAT_OTHER", slug: "gypsum-board" },
      { name: "OSB 합판", category: "MAT_OTHER", slug: "osb-panel" },
      { name: "몰딩 (MDF)", category: "MAT_OTHER", slug: "mdf-molding" },
    ];

    // materials 테이블 시드 (ON CONFLICT DO NOTHING — 재실행 안전)
    await db
      .insert(materials)
      .values(materialsSeedData)
      .onConflictDoNothing()
      .execute();
    console.log(
      `✓ Inserted ${materialsSeedData.length} materials (upsert-safe)`,
    );

    const materialsResult = await db.select().from(materials).execute();
    const byCategory = materialsResult.reduce(
      (acc, m) => {
        acc[m.category] = (acc[m.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log("\n📦 Seeded Materials Summary:");
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count}`);
    });
    console.log(`  - Total: ${materialsResult.length}\n`);

    // ─────────────────────────────────────────────────
    // 일회용 이메일 도메인 블랙리스트 시드
    // ─────────────────────────────────────────────────
    const disposableDomains = [
      // 주요 임시 메일 서비스
      { domain: "mailinator.com", category: "TEMP" },
      { domain: "guerrillamail.com", category: "GUERRILLAMAIL" },
      { domain: "guerrillamail.info", category: "GUERRILLAMAIL" },
      { domain: "guerrillamail.biz", category: "GUERRILLAMAIL" },
      { domain: "guerrillamail.de", category: "GUERRILLAMAIL" },
      { domain: "guerrillamail.net", category: "GUERRILLAMAIL" },
      { domain: "guerrillamail.org", category: "GUERRILLAMAIL" },
      { domain: "10minutemail.com", category: "TEMP" },
      { domain: "10minutemail.net", category: "TEMP" },
      { domain: "10minutemail.org", category: "TEMP" },
      { domain: "tempmail.com", category: "TEMP" },
      { domain: "temp-mail.org", category: "TEMP" },
      { domain: "temp-mail.io", category: "TEMP" },
      { domain: "throwaway.email", category: "TEMP" },
      { domain: "trashmail.com", category: "SPAM" },
      { domain: "trashmail.at", category: "SPAM" },
      { domain: "trashmail.me", category: "SPAM" },
      { domain: "trashmail.net", category: "SPAM" },
      { domain: "trashmail.org", category: "SPAM" },
      { domain: "yopmail.com", category: "TEMP" },
      { domain: "yopmail.fr", category: "TEMP" },
      { domain: "cool.fr.nf", category: "TEMP" },
      { domain: "jetable.fr.nf", category: "TEMP" },
      { domain: "nospam.ze.tc", category: "SPAM" },
      { domain: "nomail.xl.cx", category: "SPAM" },
      { domain: "mega.zik.dj", category: "SPAM" },
      { domain: "speed.1s.fr", category: "SPAM" },
      { domain: "courriel.fr.nf", category: "TEMP" },
      { domain: "moncourrier.fr.nf", category: "TEMP" },
      { domain: "monemail.fr.nf", category: "TEMP" },
      { domain: "monmail.fr.nf", category: "TEMP" },
      { domain: "dispostable.com", category: "TEMP" },
      { domain: "mailnull.com", category: "TEMP" },
      { domain: "maildrop.cc", category: "TEMP" },
      { domain: "mailnesia.com", category: "TEMP" },
      { domain: "sharklasers.com", category: "GUERRILLAMAIL" },
      { domain: "guerrillamailblock.com", category: "GUERRILLAMAIL" },
      { domain: "grr.la", category: "GUERRILLAMAIL" },
      { domain: "spam4.me", category: "SPAM" },
      { domain: "spamgourmet.com", category: "SPAM" },
      { domain: "spamgourmet.net", category: "SPAM" },
      { domain: "spamgourmet.org", category: "SPAM" },
      { domain: "spamherelots.com", category: "SPAM" },
      { domain: "spamhereplease.com", category: "SPAM" },
      { domain: "spamthisplease.com", category: "SPAM" },
      { domain: "spam.la", category: "SPAM" },
      { domain: "spamoff.de", category: "SPAM" },
      { domain: "binkmail.com", category: "TEMP" },
      { domain: "bob.email", category: "TEMP" },
      { domain: "clrmail.com", category: "TEMP" },
      { domain: "crapmail.org", category: "SPAM" },
      { domain: "deadaddress.com", category: "TEMP" },
      { domain: "despam.it", category: "SPAM" },
      { domain: "devnullmail.com", category: "TEMP" },
      { domain: "discardmail.com", category: "TEMP" },
      { domain: "discardmail.de", category: "TEMP" },
      { domain: "discard.email", category: "TEMP" },
      { domain: "dodgeit.com", category: "TEMP" },
      { domain: "dodgit.com", category: "TEMP" },
      { domain: "dontreg.com", category: "TEMP" },
      { domain: "dontsendmespam.de", category: "SPAM" },
      { domain: "dumpandfuck.com", category: "SPAM" },
      { domain: "e4ward.com", category: "TEMP" },
      { domain: "emailias.com", category: "TEMP" },
      { domain: "emailinfive.com", category: "TEMP" },
      { domain: "emailsensei.com", category: "TEMP" },
      { domain: "emailtemporanea.com", category: "TEMP" },
      { domain: "emailtemporanea.net", category: "TEMP" },
      { domain: "emailto.de", category: "TEMP" },
      { domain: "emailwarden.com", category: "TEMP" },
      { domain: "etranquil.com", category: "TEMP" },
      { domain: "etranquil.net", category: "TEMP" },
      { domain: "etranquil.org", category: "TEMP" },
      { domain: "fakeinbox.com", category: "TEMP" },
      { domain: "fakeinformation.com", category: "TEMP" },
      { domain: "fakemail.fr", category: "TEMP" },
      { domain: "fast-email.com", category: "TEMP" },
      { domain: "fast-mail.fr", category: "TEMP" },
      { domain: "fastem.com", category: "TEMP" },
      { domain: "fastemail.us", category: "TEMP" },
      { domain: "fastemailer.com", category: "TEMP" },
      { domain: "fastest.cc", category: "TEMP" },
      { domain: "fastimap.com", category: "TEMP" },
      { domain: "fddwdff.com", category: "SPAM" },
      { domain: "filzmail.com", category: "TEMP" },
      { domain: "fizmail.com", category: "TEMP" },
      { domain: "fleckens.hu", category: "TEMP" },
      { domain: "frapmail.com", category: "TEMP" },
      { domain: "fudgerub.com", category: "SPAM" },
      { domain: "garliclife.com", category: "SPAM" },
      { domain: "getonemail.com", category: "TEMP" },
      { domain: "getonemail.net", category: "TEMP" },
      { domain: "gishpuppy.com", category: "TEMP" },
      { domain: "gowikibooks.com", category: "SPAM" },
      { domain: "gowikicampus.com", category: "SPAM" },
      { domain: "gowikicars.com", category: "SPAM" },
      { domain: "gowikifilms.com", category: "SPAM" },
      { domain: "gowikigames.com", category: "SPAM" },
      { domain: "gowikimusic.com", category: "SPAM" },
      { domain: "gowikinetwork.com", category: "SPAM" },
      { domain: "gowikitravel.com", category: "SPAM" },
      { domain: "gowikitv.com", category: "SPAM" },
      { domain: "h8s.org", category: "SPAM" },
      { domain: "haltospam.com", category: "SPAM" },
      { domain: "hatespam.org", category: "SPAM" },
      { domain: "hidemail.de", category: "TEMP" },
      { domain: "hidzz.com", category: "TEMP" },
      { domain: "hmamail.com", category: "TEMP" },
      { domain: "hopemail.biz", category: "TEMP" },
      { domain: "ieatspam.eu", category: "SPAM" },
      { domain: "ieatspam.info", category: "SPAM" },
      { domain: "ieh-mail.de", category: "TEMP" },
      { domain: "inboxalias.com", category: "TEMP" },
      { domain: "inoutmail.de", category: "TEMP" },
      { domain: "inoutmail.eu", category: "TEMP" },
      { domain: "inoutmail.info", category: "TEMP" },
      { domain: "inoutmail.net", category: "TEMP" },
      { domain: "jnxjn.com", category: "SPAM" },
      { domain: "jourrapide.com", category: "TEMP" },
      { domain: "jsrsolutions.com", category: "SPAM" },
      { domain: "kasmail.com", category: "TEMP" },
      { domain: "kaspop.com", category: "TEMP" },
      { domain: "killmail.com", category: "SPAM" },
      { domain: "killmail.net", category: "SPAM" },
      { domain: "klassmaster.com", category: "TEMP" },
      { domain: "klassmaster.net", category: "TEMP" },
      { domain: "lol.ovpn.to", category: "TEMP" },
      { domain: "lookugly.com", category: "SPAM" },
      { domain: "lortemail.dk", category: "SPAM" },
      { domain: "lovemeleaveme.com", category: "SPAM" },
      { domain: "lr7.us", category: "SPAM" },
      { domain: "lr78.com", category: "SPAM" },
      { domain: "lroid.com", category: "SPAM" },
      { domain: "lukop.dk", category: "SPAM" },
      { domain: "m4ilweb.info", category: "TEMP" },
      { domain: "maboard.com", category: "TEMP" },
      { domain: "mail-filter.com", category: "TEMP" },
      { domain: "mail-temporaire.fr", category: "TEMP" },
      { domain: "mail.by", category: "SPAM" },
      { domain: "mail2rss.org", category: "SPAM" },
      { domain: "mail333.com", category: "TEMP" },
      { domain: "mailbidon.com", category: "TEMP" },
      { domain: "mailbiz.biz", category: "TEMP" },
      { domain: "mailblocks.com", category: "TEMP" },
      { domain: "mailbucket.org", category: "TEMP" },
      { domain: "mailc.net", category: "TEMP" },
      { domain: "mailcat.biz", category: "TEMP" },
      { domain: "mailcatch.com", category: "TEMP" },
      { domain: "mailde.de", category: "TEMP" },
      { domain: "mailde.info", category: "TEMP" },
      { domain: "maildu.de", category: "TEMP" },
      { domain: "maileater.com", category: "TEMP" },
      { domain: "mailed.ro", category: "TEMP" },
      { domain: "mailexpire.com", category: "TEMP" },
      { domain: "mailf5.com", category: "TEMP" },
      { domain: "mailfall.com", category: "TEMP" },
      { domain: "mailfreeonline.com", category: "TEMP" },
      { domain: "mailguard.me", category: "TEMP" },
      { domain: "mailin8r.com", category: "TEMP" },
      { domain: "mailinater.com", category: "TEMP" },
      { domain: "mailinator2.com", category: "TEMP" },
      { domain: "mailincubator.com", category: "TEMP" },
      { domain: "mailismagic.com", category: "TEMP" },
      { domain: "mailme.gq", category: "TEMP" },
      { domain: "mailme.ir", category: "TEMP" },
      { domain: "mailme.lv", category: "TEMP" },
      { domain: "mailme24.com", category: "TEMP" },
      { domain: "mailmetrash.com", category: "TEMP" },
      { domain: "mailmoat.com", category: "TEMP" },
      { domain: "mailnew.com", category: "TEMP" },
      { domain: "mailnull.com", category: "TEMP" },
      { domain: "mailox.biz", category: "TEMP" },
      { domain: "mailpick.biz", category: "TEMP" },
      { domain: "mailrock.biz", category: "TEMP" },
      { domain: "mailscrap.com", category: "SPAM" },
      { domain: "mailseal.de", category: "TEMP" },
      { domain: "mailshell.com", category: "TEMP" },
      { domain: "mailsiphon.com", category: "TEMP" },
      { domain: "mailslite.com", category: "TEMP" },
      { domain: "mailsponge.com", category: "TEMP" },
      { domain: "mailtemp.info", category: "TEMP" },
      { domain: "mailtome.de", category: "TEMP" },
      { domain: "mailtothis.com", category: "TEMP" },
      { domain: "mailtrash.net", category: "TEMP" },
      { domain: "mailtv.net", category: "TEMP" },
      { domain: "mailtv.tv", category: "TEMP" },
      { domain: "mailzilla.com", category: "TEMP" },
      { domain: "mailzilla.org", category: "TEMP" },
      { domain: "mbx.cc", category: "TEMP" },
      { domain: "mega.zik.dj", category: "SPAM" },
      { domain: "megamail.pt", category: "TEMP" },
      { domain: "meltmail.com", category: "TEMP" },
      { domain: "messagebeamer.de", category: "TEMP" },
      { domain: "mierdamail.com", category: "SPAM" },
      { domain: "mintemail.com", category: "TEMP" },
      { domain: "misterpinball.de", category: "SPAM" },
      { domain: "moncourrier.fr.nf", category: "TEMP" },
      { domain: "monemail.fr.nf", category: "TEMP" },
      { domain: "monmail.fr.nf", category: "TEMP" },
      { domain: "mt2009.com", category: "TEMP" },
      { domain: "mt2014.com", category: "TEMP" },
      { domain: "mx0.wwwnew.eu", category: "TEMP" },
      { domain: "my10minutemail.com", category: "TEMP" },
      { domain: "mypartyclip.de", category: "SPAM" },
      { domain: "myphantomemail.com", category: "TEMP" },
      { domain: "mysamp.de", category: "SPAM" },
      { domain: "mytempemail.com", category: "TEMP" },
      { domain: "mytempmail.com", category: "TEMP" },
      { domain: "mytrashmail.com", category: "SPAM" },
      { domain: "neomailbox.com", category: "TEMP" },
      { domain: "nepwk.com", category: "TEMP" },
      { domain: "nervmich.net", category: "SPAM" },
      { domain: "nervtmich.net", category: "SPAM" },
      { domain: "netmails.com", category: "TEMP" },
      { domain: "netmails.net", category: "TEMP" },
      { domain: "nevermail.de", category: "TEMP" },
      { domain: "nfmail.com", category: "TEMP" },
      { domain: "noblepioneer.com", category: "SPAM" },
      { domain: "nogmailspam.info", category: "SPAM" },
      { domain: "nomail.pw", category: "TEMP" },
      { domain: "nomail.xl.cx", category: "TEMP" },
      { domain: "nomail2me.com", category: "TEMP" },
      { domain: "nospam.ze.tc", category: "SPAM" },
      { domain: "nospam4.us", category: "SPAM" },
      { domain: "nospamfor.us", category: "SPAM" },
      { domain: "nospammail.net", category: "SPAM" },
      { domain: "notmailinator.com", category: "TEMP" },
      { domain: "nowmymail.com", category: "TEMP" },
      { domain: "nullbox.info", category: "TEMP" },
      { domain: "obobbo.com", category: "SPAM" },
      { domain: "odaymail.com", category: "TEMP" },
      { domain: "one-time.email", category: "TEMP" },
      { domain: "oneoffemail.com", category: "TEMP" },
      { domain: "onewaymail.com", category: "TEMP" },
      { domain: "online.ms", category: "TEMP" },
      { domain: "onlinemail.me", category: "TEMP" },
      { domain: "opayq.com", category: "TEMP" },
      { domain: "oregonhiker.org", category: "SPAM" },
      { domain: "owlpic.com", category: "SPAM" },
      { domain: "pancakemail.com", category: "TEMP" },
      { domain: "pimpedupmyspace.com", category: "SPAM" },
      { domain: "pookmail.com", category: "TEMP" },
      { domain: "privacy.net", category: "TEMP" },
      { domain: "privy-mail.com", category: "TEMP" },
      { domain: "privy-mail.de", category: "TEMP" },
      { domain: "privymail.de", category: "TEMP" },
      { domain: "proxymail.eu", category: "TEMP" },
      { domain: "prtnx.com", category: "SPAM" },
      { domain: "pubmail886.com", category: "SPAM" },
      { domain: "punkass.com", category: "SPAM" },
      { domain: "putthisinyourspamdatabase.com", category: "SPAM" },
      { domain: "pwrby.com", category: "SPAM" },
      { domain: "quickinbox.com", category: "TEMP" },
      { domain: "rcpt.at", category: "TEMP" },
      { domain: "re-gister.com", category: "TEMP" },
      { domain: "reclame.ru", category: "SPAM" },
      { domain: "recursor.net", category: "TEMP" },
      { domain: "rklips.com", category: "SPAM" },
      { domain: "rmqkr.net", category: "SPAM" },
      { domain: "royal.net", category: "TEMP" },
      { domain: "rppkn.com", category: "SPAM" },
      { domain: "rtrtr.com", category: "SPAM" },
      { domain: "s0ny.net", category: "SPAM" },
      { domain: "safe-mail.net", category: "TEMP" },
      { domain: "safetymail.info", category: "TEMP" },
      { domain: "safetypost.de", category: "TEMP" },
      { domain: "saynotospams.com", category: "SPAM" },
      { domain: "selfdestructingmail.com", category: "TEMP" },
      { domain: "sendspamhere.com", category: "SPAM" },
      { domain: "senseless-entertainment.com", category: "SPAM" },
      { domain: "shieldedmail.com", category: "TEMP" },
      { domain: "shitware.nl", category: "SPAM" },
      { domain: "shortmail.net", category: "TEMP" },
      { domain: "sibmail.com", category: "TEMP" },
      { domain: "skeefmail.com", category: "TEMP" },
      { domain: "slapsfromlastnight.com", category: "SPAM" },
      { domain: "slaskpost.se", category: "SPAM" },
      { domain: "slopsbox.com", category: "SPAM" },
      { domain: "slushmail.com", category: "TEMP" },
      { domain: "smashmail.de", category: "TEMP" },
      { domain: "smellfear.com", category: "SPAM" },
      { domain: "snakemail.com", category: "SPAM" },
      { domain: "sneakemail.com", category: "TEMP" },
      { domain: "sofimail.com", category: "TEMP" },
      { domain: "sogetthis.com", category: "SPAM" },
      { domain: "solopilotos.com", category: "SPAM" },
      { domain: "spamail.de", category: "SPAM" },
      { domain: "spamcon.org", category: "SPAM" },
      { domain: "spamevader.com", category: "SPAM" },
      { domain: "spamfree24.com", category: "SPAM" },
      { domain: "spamfree24.de", category: "SPAM" },
      { domain: "spamfree24.eu", category: "SPAM" },
      { domain: "spamfree24.info", category: "SPAM" },
      { domain: "spamfree24.net", category: "SPAM" },
      { domain: "spamfree24.org", category: "SPAM" },
      { domain: "spamgoes.in", category: "SPAM" },
      { domain: "spamgourmet.com", category: "SPAM" },
      { domain: "spamgourmet.net", category: "SPAM" },
      { domain: "spamgourmet.org", category: "SPAM" },
      { domain: "spamhere.eu", category: "SPAM" },
      { domain: "spamhole.com", category: "SPAM" },
      { domain: "spamify.com", category: "SPAM" },
      { domain: "spaminator.de", category: "SPAM" },
      { domain: "spamkill.info", category: "SPAM" },
      { domain: "spaml.com", category: "SPAM" },
      { domain: "spaml.de", category: "SPAM" },
      { domain: "spammotel.com", category: "SPAM" },
      { domain: "spamms.com", category: "SPAM" },
      { domain: "spamoff.de", category: "SPAM" },
      { domain: "spamsalad.in", category: "SPAM" },
      { domain: "spamslicer.com", category: "SPAM" },
      { domain: "spamspot.com", category: "SPAM" },
      { domain: "spamthis.co.uk", category: "SPAM" },
      { domain: "spamthisplease.com", category: "SPAM" },
      { domain: "spamtrail.com", category: "SPAM" },
      { domain: "speed.1s.fr", category: "SPAM" },
      { domain: "spikio.com", category: "SPAM" },
      { domain: "spoofmail.de", category: "TEMP" },
      { domain: "squizzy.de", category: "TEMP" },
      { domain: "squizzy.eu", category: "TEMP" },
      { domain: "squizzy.net", category: "TEMP" },
      { domain: "stinkefinger.net", category: "SPAM" },
      { domain: "stuffmail.de", category: "TEMP" },
      { domain: "super-auswahl.de", category: "SPAM" },
      { domain: "supergreatmail.com", category: "TEMP" },
      { domain: "supermailer.jp", category: "TEMP" },
      { domain: "suremail.info", category: "TEMP" },
      { domain: "svk.jp", category: "TEMP" },
      { domain: "sweetxxx.de", category: "SPAM" },
      { domain: "tafmail.com", category: "TEMP" },
      { domain: "tarrg.com", category: "SPAM" },
      { domain: "techemail.com", category: "TEMP" },
      { domain: "telecomix.pl", category: "SPAM" },
      { domain: "teleworm.com", category: "TEMP" },
      { domain: "teleworm.us", category: "TEMP" },
      { domain: "tempalias.com", category: "TEMP" },
      { domain: "tempe-mail.com", category: "TEMP" },
      { domain: "tempemail.biz", category: "TEMP" },
      { domain: "tempemail.com", category: "TEMP" },
      { domain: "tempemail.net", category: "TEMP" },
      { domain: "tempinbox.co.uk", category: "TEMP" },
      { domain: "tempinbox.com", category: "TEMP" },
      { domain: "tempmail.de", category: "TEMP" },
      { domain: "tempmail.eu", category: "TEMP" },
      { domain: "tempmail.it", category: "TEMP" },
      { domain: "tempr.email", category: "TEMP" },
      { domain: "tempsky.com", category: "TEMP" },
      { domain: "temporaryemail.net", category: "TEMP" },
      { domain: "temporaryinbox.com", category: "TEMP" },
      { domain: "thanksnospam.info", category: "SPAM" },
      { domain: "thc.st", category: "SPAM" },
      { domain: "thelimestones.com", category: "SPAM" },
      { domain: "throwam.com", category: "TEMP" },
      { domain: "throwam.com", category: "TEMP" },
      { domain: "trbvm.com", category: "SPAM" },
      { domain: "trialmail.de", category: "TEMP" },
      { domain: "trickmail.net", category: "SPAM" },
      { domain: "trillianpro.com", category: "SPAM" },
      { domain: "tryalert.com", category: "TEMP" },
      { domain: "turual.com", category: "TEMP" },
      { domain: "twinmail.de", category: "TEMP" },
      { domain: "tyldd.com", category: "SPAM" },
      { domain: "uggsrock.com", category: "SPAM" },
      { domain: "umail.net", category: "TEMP" },
      { domain: "unimark.org", category: "TEMP" },
      { domain: "unmail.ru", category: "TEMP" },
      { domain: "uroid.com", category: "SPAM" },
      { domain: "used.hu", category: "TEMP" },
      { domain: "valemail.net", category: "TEMP" },
      { domain: "venompen.com", category: "SPAM" },
      { domain: "vermutlich.net", category: "TEMP" },
      { domain: "veryrealemail.com", category: "TEMP" },
      { domain: "viditag.com", category: "SPAM" },
      { domain: "viralplays.com", category: "SPAM" },
      { domain: "vpn.st", category: "TEMP" },
      { domain: "vsimcard.com", category: "TEMP" },
      { domain: "vubby.com", category: "SPAM" },
      { domain: "walala.org", category: "SPAM" },
      { domain: "walkmail.net", category: "TEMP" },
      { domain: "walkmail.ru", category: "TEMP" },
      { domain: "webemail.me", category: "TEMP" },
      { domain: "webm4il.info", category: "TEMP" },
      { domain: "weg-werf-email.de", category: "TEMP" },
      { domain: "wegwerf-email-addressen.de", category: "TEMP" },
      { domain: "wegwerf-emails.de", category: "TEMP" },
      { domain: "wegwerfadresse.de", category: "TEMP" },
      { domain: "wegwerfemail.de", category: "TEMP" },
      { domain: "wegwerfmail.de", category: "TEMP" },
      { domain: "wegwerfmail.net", category: "TEMP" },
      { domain: "wegwerfmail.org", category: "TEMP" },
      { domain: "wh4f.org", category: "SPAM" },
      { domain: "whyspam.me", category: "SPAM" },
      { domain: "willhackforfood.biz", category: "SPAM" },
      { domain: "willselfdestruct.com", category: "TEMP" },
      { domain: "wilemail.com", category: "TEMP" },
      { domain: "wmail.cf", category: "TEMP" },
      { domain: "wolfsmail.at", category: "SPAM" },
      { domain: "wolfsmail.tk", category: "SPAM" },
      { domain: "worldspace.link", category: "TEMP" },
      { domain: "wuzup.net", category: "SPAM" },
      { domain: "wuzupmail.net", category: "SPAM" },
      { domain: "xagloo.co", category: "TEMP" },
      { domain: "xagloo.com", category: "TEMP" },
      { domain: "xemaps.com", category: "SPAM" },
      { domain: "xents.com", category: "SPAM" },
      { domain: "xmaily.com", category: "TEMP" },
      { domain: "xoxy.net", category: "TEMP" },
      { domain: "xsmail.com", category: "TEMP" },
      { domain: "xyzfree.net", category: "TEMP" },
      { domain: "yapped.net", category: "SPAM" },
      { domain: "yeah.net", category: "SPAM" },
      { domain: "yep.it", category: "TEMP" },
      { domain: "yogamaven.com", category: "SPAM" },
      { domain: "yomail.info", category: "TEMP" },
      { domain: "youmail.ga", category: "TEMP" },
      { domain: "youmails.online", category: "TEMP" },
      { domain: "ypmail.webarnak.fr.eu.org", category: "TEMP" },
      { domain: "yuurok.com", category: "SPAM" },
      { domain: "z1p.biz", category: "TEMP" },
      { domain: "za.com", category: "SPAM" },
      { domain: "zebins.com", category: "TEMP" },
      { domain: "zebins.eu", category: "TEMP" },
      { domain: "zehnminutenmail.de", category: "TEMP" },
      { domain: "zetmail.com", category: "TEMP" },
      { domain: "zippymail.info", category: "TEMP" },
      { domain: "zoaxe.com", category: "SPAM" },
      { domain: "zoemail.com", category: "TEMP" },
      { domain: "zoemail.net", category: "TEMP" },
      { domain: "zoemail.org", category: "TEMP" },
      { domain: "zomg.info", category: "SPAM" },
      { domain: "zxcv.com", category: "SPAM" },
      { domain: "zxcvbnm.com", category: "SPAM" },
      { domain: "zzz.com", category: "SPAM" },
    ];

    // ON CONFLICT DO NOTHING — 재실행 안전
    await db
      .insert(disposableEmailBlacklist)
      .values(disposableDomains)
      .onConflictDoNothing()
      .execute();
    console.log(
      `✓ Inserted ${disposableDomains.length} disposable email domains (upsert-safe)`,
    );

    const disposableResult = await db
      .select()
      .from(disposableEmailBlacklist)
      .execute();
    const byDisposableCategory = disposableResult.reduce(
      (acc, d) => {
        const cat = d.category ?? "UNKNOWN";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log("\n🚫 Seeded Disposable Email Blacklist Summary:");
    Object.entries(byDisposableCategory).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count}`);
    });
    console.log(`  - Total: ${disposableResult.length}\n`);

    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
