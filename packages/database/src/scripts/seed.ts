import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { masterCodes, workerFields, workerAreas } from "../schema";
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

    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
