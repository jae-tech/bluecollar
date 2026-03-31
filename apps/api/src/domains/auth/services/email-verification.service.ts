import {
  Injectable,
  BadRequestException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { emailVerificationCodes } from '@repo/database';
import { eq, and, lt } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import { PinoLogger } from 'nestjs-pino';

/**
 * 이메일 인증 서비스
 *
 * 이메일 인증 코드의 생성, 발송, 검증을 관리합니다.
 * 토큰 재사용 방지 및 만료 처리를 수행합니다.
 *
 * 인증 타입:
 * - SIGNUP: 회원가입 이메일 인증
 * - PASSWORD_RESET: 비밀번호 재설정 인증
 * - EMAIL_CHANGE: 이메일 변경 인증
 *
 * 코드 전략:
 * - 형식: 6자리 숫자 (100000~999999)
 * - 유효기한: 24시간
 * - 재사용 방지: isUsed 플래그
 */
@Injectable()
export class EmailVerificationService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    @Inject('EMAIL_SERVICE') private emailService: any, // IEmailService 인터페이스
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(EmailVerificationService.name);
    }
  }

  /**
   * 이메일 인증 코드 생성 및 발송
   *
   * 프로세스:
   * 1. 6자리 숫자 인증 코드 생성 (100000~999999)
   * 2. DB에 저장 (24시간 유효기한)
   * 3. 이메일로 발송
   * 4. 개발 환경에서만 코드 반환
   *
   * @param email 대상 이메일
   * @param type 인증 타입 ('SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_CHANGE')
   * @returns 개발 환경에서만 코드 반환 (프로덕션에서는 보안상 반환 안 함)
   */
  async sendVerificationCode(
    email: string,
    type: 'SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_CHANGE' = 'SIGNUP',
  ): Promise<{ code: string }> {
    try {
      this.logger.info({ email, type }, '이메일 인증 코드 생성 중...');

      // 🔐 1. 6자리 숫자 인증 코드 생성 (100000 ~ 999999)
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // ⏰ 2. 24시간 후 만료 시각 계산
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // 💾 3. DB에 저장
      await this.db.insert(emailVerificationCodes).values({
        email: email.toLowerCase(),
        code,
        type,
        expiresAt,
      });

      this.logger.info(
        { email, type, expiresAt: expiresAt.toISOString() },
        '이메일 인증 코드 저장 완료',
      );

      // 📧 4. 이메일 발송 (EmailService 호출)
      try {
        await this.emailService.sendVerificationEmail(email, code, type);
        this.logger.info({ email }, '이메일 인증 코드 발송 성공');
      } catch (emailError) {
        this.logger.error(
          { email, error: (emailError as Error).message },
          '이메일 발송 실패 (DB는 저장됨)',
        );
        // 이메일 발송 실패해도 계속 진행 (DB에는 저장됨)
      }

      // 🔍 5. 개발 환경에서만 코드 반환 (테스트용)
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug({ code }, '[DEV] 인증 코드 반환');
        return { code };
      }

      // 프로덕션에서는 빈 응답 반환 (보안)
      return { code: '' };
    } catch (error) {
      this.logger.error(
        { email, error: (error as Error).message },
        '이메일 인증 코드 생성 실패',
      );
      throw new BadRequestException('인증 코드 생성에 실패했습니다');
    }
  }

  /**
   * 이메일 인증 코드 검증
   *
   * 프로세스:
   * 1. DB에서 코드 조회
   * 2. 타입, 만료, 사용 여부 확인
   * 3. 검증 성공 시 isUsed = true 로 표시
   * 4. 재사용 방지
   *
   * @param email 대상 이메일
   * @param code 사용자가 입력한 코드
   * @param type 인증 타입
   * @returns 검증 성공 여부
   *
   * @throws UnauthorizedException 코드가 일치하지 않거나 만료된 경우
   */
  async verifyEmailCode(
    email: string,
    code: string,
    type: string,
  ): Promise<boolean> {
    try {
      this.logger.info({ email, type }, '이메일 인증 코드 검증 중...');

      // 1️⃣ DB에서 해당하는 코드 조회
      const records = await this.db
        .select()
        .from(emailVerificationCodes)
        .where(
          and(
            eq(emailVerificationCodes.email, email.toLowerCase()),
            eq(emailVerificationCodes.code, code),
            eq(emailVerificationCodes.type, type),
          ),
        )
        .limit(1);

      // 코드를 찾을 수 없음
      if (records.length === 0) {
        this.logger.warn({ email, type }, '이메일 인증 코드를 찾을 수 없음');
        throw new UnauthorizedException('유효하지 않은 인증 코드입니다');
      }

      const record = records[0];

      // 2️⃣ 만료 여부 확인
      if (new Date() > record.expiresAt) {
        this.logger.warn(
          { email, expiresAt: record.expiresAt },
          '인증 코드 만료됨',
        );
        throw new UnauthorizedException('인증 코드가 만료되었습니다');
      }

      // 3️⃣ 이미 사용된 코드인지 확인 (재사용 방지)
      if (record.isUsed) {
        this.logger.warn(
          { email, usedAt: record.usedAt },
          '이미 사용된 인증 코드 재사용 시도',
        );
        throw new UnauthorizedException('이미 사용된 인증 코드입니다');
      }

      // 4️⃣ 검증 성공 시 isUsed = true로 표시 (재사용 방지)
      await this.db
        .update(emailVerificationCodes)
        .set({
          isUsed: true,
          usedAt: new Date(),
        })
        .where(eq(emailVerificationCodes.id, record.id));

      this.logger.info({ email, type }, '이메일 인증 코드 검증 완료');

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        { email, error: (error as Error).message },
        '이메일 인증 코드 검증 중 오류 발생',
      );
      throw new BadRequestException('인증 코드 검증에 실패했습니다');
    }
  }

  /**
   * 만료된 인증 코드 정리 (Cron Job용)
   *
   * 정기적으로 만료된 코드를 DB에서 삭제합니다.
   * 스케줄러에서 매일 1회 실행을 권장합니다.
   *
   * 예시 설정:
   * @Cron(CronExpression.EVERY_DAY_AT_2AM)
   * async cleanupExpiredCodes() {
   *   await this.emailVerificationService.cleanupExpiredCodes();
   * }
   *
   * @returns 삭제된 코드 개수
   */
  async cleanupExpiredCodes(): Promise<number> {
    try {
      this.logger.debug('만료된 이메일 인증 코드 정리 중...');

      // 만료된 코드 삭제 (AND 이미 사용된 코드)
      // 미사용-만료 코드는 유저가 원인 파악 가능하도록 보존하지 않고 삭제
      // 단, isUsed=true인 코드는 즉시 삭제 대상
      const result = await this.db
        .delete(emailVerificationCodes)
        .where(
          and(
            lt(emailVerificationCodes.expiresAt, new Date()),
            eq(emailVerificationCodes.isUsed, true),
          ),
        )
        .returning({ id: emailVerificationCodes.id });

      this.logger.info(
        { count: result.length },
        '만료된 이메일 인증 코드 정리 완료',
      );

      return result.length;
    } catch (error) {
      this.logger.error(
        { error: (error as Error).message },
        '만료된 이메일 인증 코드 정리 실패',
      );
      return 0;
    }
  }

  /**
   * 특정 이메일의 미사용 토큰 개수 조회
   *
   * Rate Limiting을 위해 사용합니다.
   * 너무 많은 코드 재발급 요청을 감지할 수 있습니다.
   *
   * @param email 이메일 주소
   * @param type 인증 타입 (선택사항)
   * @returns 미사용 토큰 개수
   */
  async getUnusedCodeCount(email: string, type?: string): Promise<number> {
    try {
      const where = type
        ? and(
            eq(emailVerificationCodes.email, email.toLowerCase()),
            eq(emailVerificationCodes.type, type),
            eq(emailVerificationCodes.isUsed, false),
          )
        : and(
            eq(emailVerificationCodes.email, email.toLowerCase()),
            eq(emailVerificationCodes.isUsed, false),
          );

      const records = await this.db
        .select({ id: emailVerificationCodes.id })
        .from(emailVerificationCodes)
        .where(where);

      return records.length;
    } catch (error) {
      this.logger.error(
        { email, error: (error as Error).message },
        '미사용 토큰 개수 조회 실패',
      );
      return 0;
    }
  }
}
