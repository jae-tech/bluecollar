import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { masterCodes } from "../schema";
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
      // --- FIELD (업종) ---
      {
        code: "FLD_TILE",
        group: "FIELD",
        name: "타일 공사",
        sortOrder: 1,
      },
      {
        code: "FLD_WALLPAPER",
        group: "FIELD",
        name: "도배 공사",
        sortOrder: 2,
      },
      {
        code: "FLD_ELECTRIC",
        group: "FIELD",
        name: "전기 공사",
        sortOrder: 3,
      },
      {
        code: "FLD_PLUMBING",
        group: "FIELD",
        name: "배관 공사",
        sortOrder: 4,
      },
      {
        code: "FLD_CARPENTRY",
        group: "FIELD",
        name: "목공 공사",
        sortOrder: 5,
      },
      {
        code: "FLD_PAINTING",
        group: "FIELD",
        name: "페인팅",
        sortOrder: 6,
      },
      {
        code: "FLD_FLOORING",
        group: "FIELD",
        name: "마루/바닥재",
        sortOrder: 7,
      },
      {
        code: "FLD_GLAZING",
        group: "FIELD",
        name: "유리 공사",
        sortOrder: 8,
      },

      // --- AREA (지역) ---
      {
        code: "AREA_SEOUL_GN",
        group: "AREA",
        name: "서울 강남구",
        sortOrder: 1,
      },
      {
        code: "AREA_SEOUL_SC",
        group: "AREA",
        name: "서울 서초구",
        sortOrder: 2,
      },
      {
        code: "AREA_SEOUL_SP",
        group: "AREA",
        name: "서울 송파구",
        sortOrder: 3,
      },
      {
        code: "AREA_SEOUL_JG",
        group: "AREA",
        name: "서울 중구",
        sortOrder: 4,
      },
      {
        code: "AREA_SEOUL_JO",
        group: "AREA",
        name: "서울 종로구",
        sortOrder: 5,
      },
      {
        code: "AREA_SEOUL_YL",
        group: "AREA",
        name: "서울 영등포구",
        sortOrder: 6,
      },
      {
        code: "AREA_SEOUL_MS",
        group: "AREA",
        name: "서울 마포구",
        sortOrder: 7,
      },
      {
        code: "AREA_SEOUL_DJ",
        group: "AREA",
        name: "서울 동작구",
        sortOrder: 8,
      },
      {
        code: "AREA_SEOUL_GB",
        group: "AREA",
        name: "서울 강북구",
        sortOrder: 9,
      },
      {
        code: "AREA_SEOUL_SR",
        group: "AREA",
        name: "서울 성북구",
        sortOrder: 10,
      },

      // --- EXP (숙련도) ---
      {
        code: "EXP_1TO3",
        group: "EXP",
        name: "1~3년",
        sortOrder: 1,
      },
      {
        code: "EXP_3TO5",
        group: "EXP",
        name: "3~5년",
        sortOrder: 2,
      },
      {
        code: "EXP_5TO10",
        group: "EXP",
        name: "5~10년",
        sortOrder: 3,
      },
      {
        code: "EXP_10PLUS",
        group: "EXP",
        name: "10년 이상",
        sortOrder: 4,
      },

      // --- BIZ (사업자 유형) ---
      {
        code: "BIZ_INDIVIDUAL",
        group: "BIZ",
        name: "개인",
        sortOrder: 1,
      },
      {
        code: "BIZ_SOLE",
        group: "BIZ",
        name: "개인사업자",
        sortOrder: 2,
      },
      {
        code: "BIZ_CORPORATE",
        group: "BIZ",
        name: "법인사업자",
        sortOrder: 3,
      },
    ];

    // 기존 데이터 삭제 (개발 환경용)
    await db.delete(masterCodes).execute();
    console.log("✓ Cleared existing master codes");

    // 새로운 데이터 삽입
    await db.insert(masterCodes).values(seedData).execute();
    console.log(`✓ Inserted ${seedData.length} master codes`);

    // 결과 확인
    const result = await db.select().from(masterCodes).execute();
    console.log("\n📊 Seeded Master Codes Summary:");
    console.log(`  - FIELD: ${result.filter((r) => r.group === "FIELD").length}`);
    console.log(`  - AREA: ${result.filter((r) => r.group === "AREA").length}`);
    console.log(`  - EXP: ${result.filter((r) => r.group === "EXP").length}`);
    console.log(`  - BIZ: ${result.filter((r) => r.group === "BIZ").length}`);
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
