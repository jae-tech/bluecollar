/**
 * 공간(방) 유형 — DB schema의 roomTypeEnum과 동기화 유지
 * 변경 시 packages/database/src/schema.ts의 roomTypeEnum도 함께 수정할 것
 */
export const ROOM_TYPE_VALUES = [
  "LIVING",
  "BATHROOM",
  "KITCHEN",
  "BEDROOM",
  "BALCONY",
  "ENTRANCE",
  "UTILITY",
  "STUDY",
  "OTHER",
] as const;

export type RoomType = (typeof ROOM_TYPE_VALUES)[number];
