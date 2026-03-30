import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { disposableEmailBlacklist } from '@repo/database';
import { ilike } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import { PinoLogger } from 'nestjs-pino';

/**
 * 이메일 정규화 서비스
 *
 * 이메일 주소의 일관성과 보안을 보장합니다:
 * 1. Gmail '+' 기호를 이용한 별칭 공격 차단
 * 2. 일회용 이메일 도메인 차단
 * 3. 이메일 정규화 (소문자, 공백 제거)
 *
 * 예시:
 * - input: "User+Tag@Gmail.com"
 * - normalized: "user@gmail.com"
 * - disposable check: true/false
 */
@Injectable()
export class EmailNormalizationService {
  // 일회용 이메일 블랙리스트 캐시 (서버 시작 시 로드)
  private disposableEmailCache: Set<string> = new Set();

  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(EmailNormalizationService.name);
    }

    // 서버 시작 시 블랙리스트 초기화
    this.initializeBlacklist().catch((error) => {
      this.logger?.error(
        { error: (error as Error).message },
        '일회용 이메일 블랙리스트 초기화 실패',
      );
    });
  }

  /**
   * 이메일 정규화 (동기)
   *
   * 규칙:
   * 1. 소문자 변환
   * 2. 공백 제거 (양쪽 끝)
   * 3. Gmail '+' 별칭 제거
   *
   * @example
   * normalizeEmail("User+Tag@Gmail.com") → "user@gmail.com"
   * normalizeEmail("  john@example.com  ") → "john@example.com"
   */
  normalizeEmail(email: string): string {
    // 빈 문자열 체크
    if (!email || typeof email !== 'string') {
      return '';
    }

    // 소문자로 변환하고 공백 제거
    let normalized = email.trim().toLowerCase();

    // Gmail '+' 기호 제거 (별칭 공격 차단)
    // user+tag@gmail.com → user@gmail.com
    const [localPart, domain] = normalized.split('@');
    if (localPart && domain) {
      const cleanedLocalPart = localPart.split('+')[0]; // '+' 이후 제거
      normalized = `${cleanedLocalPart}@${domain}`;
    }

    this.logger.debug({ original: email, normalized }, '이메일 정규화 완료');

    return normalized;
  }

  /**
   * 일회용 이메일 도메인 확인 (비동기 캐시 사용)
   *
   * 블랙리스트에 등재된 도메인인지 확인합니다.
   * 캐시를 사용하므로 매우 빠릅니다 (O(1)).
   *
   * @example
   * const isDisposable = await emailNormalizationService.isDisposableEmail("user@tempmail.com");
   * // isDisposable → true (차단됨)
   */
  async isDisposableEmail(email: string): Promise<boolean> {
    if (!email || !email.includes('@')) {
      return false;
    }

    // 이메일에서 도메인 추출
    const domain = email.split('@')[1].toLowerCase();

    // 캐시에서 확인 (매우 빠름)
    const isDisposable = this.disposableEmailCache.has(domain);

    this.logger.debug(
      { email, domain, isDisposable },
      '일회용 이메일 도메인 확인',
    );

    return isDisposable;
  }

  /**
   * 일회용 이메일 블랙리스트 초기화 (서버 시작 시 1회만 실행)
   *
   * DB에서 모든 일회용 이메일 도메인을 로드하여 메모리 캐시에 저장합니다.
   * 이를 통해 이후 모든 확인이 O(1) 시간에 완료됩니다.
   *
   * 주의:
   * - 테이블이 없으면 무시하고 빈 캐시로 동작
   * - 블랙리스트가 추가/수정되면 서버를 재시작해야 반영됨
   * - (선택사항: 정기적 리로드 작업 추가 가능)
   */
  async initializeBlacklist(): Promise<void> {
    try {
      this.logger.info('일회용 이메일 블랙리스트 초기화 중...');

      // DB에서 모든 도메인 로드
      const blacklistedDomains = await this.db
        .select({ domain: disposableEmailBlacklist.domain })
        .from(disposableEmailBlacklist);

      // 캐시에 저장 (Set으로 O(1) 조회 성능 확보)
      this.disposableEmailCache.clear();
      blacklistedDomains.forEach((record) => {
        this.disposableEmailCache.add(record.domain.toLowerCase());
      });

      this.logger.info(
        { count: this.disposableEmailCache.size },
        '일회용 이메일 블랙리스트 로드 완료',
      );
    } catch (error) {
      const errorMessage = (error as Error).message;

      // 테이블이 없거나 쿼리 실패 시 로그하고 빈 캐시로 동작
      if (
        errorMessage.includes('does not exist') ||
        errorMessage.includes('disposable_email_blacklist')
      ) {
        this.logger.warn(
          '⚠️  disposable_email_blacklist 테이블이 없습니다. 빈 블랙리스트로 계속 진행합니다.',
        );
      } else {
        this.logger.error(
          { error: errorMessage },
          '일회용 이메일 블랙리스트 초기화 실패',
        );
      }

      // 오류 발생 시에도 서비스 계속 동작 (빈 캐시로)
      this.disposableEmailCache.clear();
    }
  }

  /**
   * 이메일 도메인 블랙리스트에 새로운 도메인 추가 (관리자용)
   *
   * @param domain 추가할 도메인 (예: "tempmail.com")
   * @param category 카테고리 (예: "TEMP", "SPAM")
   */
  async addToBlacklist(domain: string, category?: string): Promise<void> {
    try {
      const normalizedDomain = domain.toLowerCase();

      // DB에 저장
      await this.db.insert(disposableEmailBlacklist).values({
        domain: normalizedDomain,
        category,
      });

      // 캐시 업데이트
      this.disposableEmailCache.add(normalizedDomain);

      this.logger.info(
        { domain: normalizedDomain },
        '블랙리스트에 도메인 추가',
      );
    } catch (error) {
      this.logger.error(
        { domain, error: (error as Error).message },
        '블랙리스트 추가 실패',
      );
      throw error;
    }
  }

  /**
   * 블랙리스트에 도메인이 있는지 확인 (관리자용)
   *
   * @param domain 검사할 도메인
   */
  async isInBlacklist(domain: string): Promise<boolean> {
    return this.disposableEmailCache.has(domain.toLowerCase());
  }

  /**
   * 블랙리스트 도메인 개수 조회
   */
  getBlacklistSize(): number {
    return this.disposableEmailCache.size;
  }
}
