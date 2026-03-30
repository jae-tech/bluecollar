/**
 * 표준화된 에러 응답 인터페이스
 *
 * 모든 API 에러 응답이 이 형식을 따릅니다.
 */
export interface ErrorResponse {
  /**
   * HTTP 상태 코드
   */
  statusCode: number;

  /**
   * 사용자 친화적 에러 메시지
   * - 단일 메시지: 일반 에러
   * - 배열: 필드별 유효성 검사 에러
   */
  message: string | string[];

  /**
   * 에러 타입/이름
   * - "Bad Request", "Unauthorized", "Conflict" 등
   */
  error: string;

  /**
   * ISO 8601 형식의 timestamp
   */
  timestamp: string;

  /**
   * 요청한 API 경로
   */
  path: string;

  /**
   * 요청 추적용 ID (선택사항)
   */
  requestId?: string;
}
