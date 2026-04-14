import { describe, it, expect } from "vitest";
import { isValidSlugFormat } from "./slug-format";

describe("isValidSlugFormat", () => {
  // ── 유효한 케이스 ─────────────────────────────────────────
  it("영문 소문자만 사용 가능", () => {
    expect(isValidSlugFormat("abc")).toBe(true);
  });

  it("영문 + 숫자 조합 가능", () => {
    expect(isValidSlugFormat("kim123")).toBe(true);
  });

  it("하이픈 포함 가능 (중간)", () => {
    expect(isValidSlugFormat("kim-tile-expert")).toBe(true);
  });

  it("50자 slug 허용", () => {
    expect(isValidSlugFormat("a".repeat(50))).toBe(true);
  });

  // ── 길이 제한 ─────────────────────────────────────────────
  it("2자 이하 slug 거부", () => {
    expect(isValidSlugFormat("ab")).toBe(false);
  });

  it("51자 이상 slug 거부", () => {
    expect(isValidSlugFormat("a".repeat(51))).toBe(false);
  });

  it("빈 문자열 거부", () => {
    expect(isValidSlugFormat("")).toBe(false);
  });

  // ── 금지 문자 ─────────────────────────────────────────────
  it("대문자 포함 slug 거부", () => {
    expect(isValidSlugFormat("Kim")).toBe(false);
  });

  it("한글 포함 slug 거부", () => {
    expect(isValidSlugFormat("김타일")).toBe(false);
  });

  it("공백 포함 slug 거부", () => {
    expect(isValidSlugFormat("kim tile")).toBe(false);
  });

  it("특수문자 포함 slug 거부", () => {
    expect(isValidSlugFormat("kim_tile")).toBe(false);
    expect(isValidSlugFormat("kim.tile")).toBe(false);
    expect(isValidSlugFormat("kim@tile")).toBe(false);
  });

  // ── 시작/종료 규칙 ────────────────────────────────────────
  it("숫자로 시작하는 slug 거부", () => {
    expect(isValidSlugFormat("1kim")).toBe(false);
    expect(isValidSlugFormat("123abc")).toBe(false);
  });

  it("하이픈으로 시작하는 slug 거부", () => {
    expect(isValidSlugFormat("-kim")).toBe(false);
  });

  it("하이픈으로 끝나는 slug 거부", () => {
    expect(isValidSlugFormat("kim-")).toBe(false);
  });

  // ── 연속 하이픈 ───────────────────────────────────────────
  it("연속 하이픈 slug 거부", () => {
    expect(isValidSlugFormat("kim--tile")).toBe(false);
  });

  it("단일 하이픈은 허용", () => {
    expect(isValidSlugFormat("kim-tile")).toBe(true);
  });
});
