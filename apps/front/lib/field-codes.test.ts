import { describe, it, expect } from "vitest";
import { FIELD_CODE_LABELS } from "./field-codes";

// fieldLabel 함수 동작 검증 — page.tsx의 fieldLabel(code)과 동일한 로직
function fieldLabel(code: string): string {
  return FIELD_CODE_LABELS[code] ?? code;
}

describe("FIELD_CODE_LABELS", () => {
  it("FLD_* 코드를 한국어 레이블로 변환한다", () => {
    expect(fieldLabel("FLD_TILE")).toBe("타일");
    expect(fieldLabel("FLD_WINDOW")).toBe("창호");
    expect(fieldLabel("FLD_PAINTING")).toBe("도배");
    expect(fieldLabel("FLD_ELECTRIC")).toBe("전기");
    expect(fieldLabel("FLD_INTERIOR")).toBe("인테리어");
  });

  it("알 수 없는 코드는 원본 코드를 그대로 반환한다 (fallback)", () => {
    expect(fieldLabel("FLD_UNKNOWN")).toBe("FLD_UNKNOWN");
    expect(fieldLabel("")).toBe("");
    expect(fieldLabel("INVALID_CODE")).toBe("INVALID_CODE");
  });

  it("모든 FLD_ 코드가 한국어 레이블을 가진다", () => {
    const fldCodes = Object.keys(FIELD_CODE_LABELS);
    expect(fldCodes.length).toBeGreaterThan(0);
    fldCodes.forEach((code) => {
      expect(code).toMatch(/^FLD_/);
      expect(FIELD_CODE_LABELS[code]).toBeTruthy();
    });
  });
});
