import {
  Inject,
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import {
  users,
  workerProfiles,
  workerFields,
  workerAreas,
  authCodes,
} from '@repo/database';
import { CreateWorkerDto } from '../dtos/create-worker.dto';
import { EmailSignupDto } from '../dtos/email-signup.dto';
import { EmailVerificationDto } from '../dtos/email-verification.dto';
import { eq, desc, and, lt } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import type { ISmsService } from '@/infrastructure/sms/interfaces/sms-service.interface';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenService } from './token.service';
import { EmailVerificationService } from './email-verification.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
    @Inject('SMS_SERVICE') private readonly smsService: ISmsService,
    private readonly tokenService: TokenService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {
    // Logger가 제대로 주입되었으면 context 설정
    // (Test 환경에서 logger가 없을 수도 있으므로 safe check)
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(AuthService.name);
    }
  }

  /**
   * 워커(블루칼라 전문가) 회원가입
   *
   * 트랜잭션 내에서 다음 단계를 순차적으로 처리:
   * 1. 휴대폰 번호 & slug 중복 확인
   * 2. users 테이블에 신규 유저 생성
   * 3. worker_profiles에 프로필 정보 저장
   * 4. worker_fields에 전문 분야 매핑 (선택사항)
   * 5. worker_areas에 서비스 지역 매핑 (선택사항)
   *
   * @param createWorkerDto 워커 회원가입 DTO
   * @returns 생성된 유저 및 프로필 정보
   * @throws ConflictException - 중복된 phoneNumber 또는 slug
   */
  async registerWorker(createWorkerDto: CreateWorkerDto) {
    const {
      phoneNumber,
      businessName,
      slug,
      fieldCodes,
      areaCodes,
      realName,
      email,
    } = createWorkerDto;

    this.logger.info(
      { phoneNumber, slug },
      'Starting worker registration process',
    );

    // Transaction을 사용하여 원자성 보장: 모든 테이블 작업이 성공 또는 실패해야 함
    return await this.db.transaction(async (tx) => {
      try {
        // Step 1: 휴대폰 번호 중복 확인
        this.logger.debug({ phoneNumber }, 'Checking phone number uniqueness');
        const existingUser = await tx
          .select()
          .from(users)
          .where(eq(users.phoneNumber, phoneNumber))
          .limit(1);

        if (existingUser.length > 0) {
          throw new ConflictException('이미 등록된 휴대폰 번호입니다');
        }

        // Step 2: slug(사업자 고유 ID) 중복 확인
        this.logger.debug({ slug }, 'Checking slug uniqueness');
        const existingProfile = await tx
          .select()
          .from(workerProfiles)
          .where(eq(workerProfiles.slug, slug))
          .limit(1);

        if (existingProfile.length > 0) {
          throw new ConflictException('이미 사용 중인 slug입니다');
        }

        // Step 3: users 테이블에 신규 유저 정보 저장
        // 📧 Email-based schema: email은 NOT NULL이므로 반드시 제공해야 함
        if (!email) {
          throw new BadRequestException('이메일은 필수 항목입니다');
        }

        this.logger.debug({ phoneNumber, email }, 'Inserting user record');
        const [newUser] = await tx
          .insert(users)
          .values({
            phoneNumber,
            password: null, // 비밀번호는 이후 로그인 전 설정
            email: email.toLowerCase(),
            realName: realName || undefined,
            role: 'WORKER',
            status: 'INACTIVE', // 📧 Email 확인 필요, 📞 Phone 확인 필요
            emailVerified: false,
            phoneVerified: false,
            provider: 'local',
            isVerified: false, // SMS 인증 전 미인증 상태 (향후 삭제 예정)
          })
          .returning();

        const userId = newUser.id;
        this.logger.info({ userId }, 'User created successfully');

        // Step 4: worker_profiles 테이블에 프로필 정보 저장
        // 회원가입 시 즉시 워커 프로필이 생성되며, slug.bluecollar.cv 도메인이 활성화됨
        this.logger.debug({ userId }, 'Inserting worker profile record');
        const [newWorkerProfile] = await tx
          .insert(workerProfiles)
          .values({
            userId,
            slug,
            businessName,
            profileImageUrl: undefined, // 프로필 이미지는 이후 업데이트
            description: undefined, // 자기소개는 이후 편집
          })
          .returning();

        const workerProfileId = newWorkerProfile.id;
        this.logger.info({ workerProfileId }, 'Worker profile created');

        // Step 5: worker_fields (전문 분야) 관계 테이블에 매핑 정보 저장
        if (fieldCodes && fieldCodes.length > 0) {
          this.logger.debug(
            { count: fieldCodes.length },
            'Inserting worker field codes',
          );
          await tx.insert(workerFields).values(
            fieldCodes.map((fieldCode) => ({
              workerProfileId,
              fieldCode,
            })),
          );
        }

        // Step 6: worker_areas (서비스 지역) 관계 테이블에 매핑 정보 저장
        if (areaCodes && areaCodes.length > 0) {
          this.logger.debug(
            { count: areaCodes.length },
            'Inserting worker area codes',
          );
          await tx.insert(workerAreas).values(
            areaCodes.map((areaCode) => ({
              workerProfileId,
              areaCode,
            })),
          );
        }

        this.logger.info(
          { userId, workerProfileId },
          'Worker registration completed successfully',
        );

        // 클라이언트에 반환할 회원가입 성공 결과
        return {
          id: userId,
          phoneNumber,
          role: 'WORKER',
          workerProfile: {
            id: workerProfileId,
            slug,
            businessName,
          },
        };
      } catch (error) {
        // 에러 발생 시 Transaction이 자동으로 rollback 됨
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          { error: errorMessage, stack: errorStack },
          'Worker registration failed',
        );
        throw error;
      }
    });
  }

  /**
   * SMS 인증번호 발송
   *
   * 다음 단계로 진행:
   * 1. 6자리 난수 인증번호 생성
   * 2. auth_codes 테이블에 저장 (10분 유효기한 설정)
   * 3. SmsService를 통해 SMS 발송
   *
   * @param phoneNumber 휴대폰 번호 (수신자)
   * @returns 발송된 인증번호 (개발/테스트 용도로만 반환)
   * @throws Error - SMS 발송 실패 시 에러 re-throw
   */
  async sendVerificationCode(
    phoneNumber: string,
  ): Promise<{ code?: string; message: string }> {
    this.logger.info(
      { phoneNumber },
      'Starting verification code sending process',
    );

    // Step 1: 6자리 난수 인증번호 생성 (000000 ~ 999999)
    // padStart를 사용하여 '1'이 아닌 '000001'로 만들기
    const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    this.logger.debug({ code }, 'Generated verification code');

    try {
      // Step 2: auth_codes 테이블에 저장
      // 유효기한: 현재 시간 + 10분
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      this.logger.debug(
        { phoneNumber, expiresAt },
        'Saving auth code to database',
      );

      await this.db.insert(authCodes).values({
        phoneNumber,
        code,
        isUsed: false, // 아직 검증되지 않은 상태
        expiresAt,
      });

      this.logger.info(
        { phoneNumber },
        'Auth code saved to database successfully',
      );

      // Step 3: SmsService를 통해 실제 SMS 발송 (또는 개발 환경에서는 콘솔 출력)
      await this.smsService.sendVerificationCode(phoneNumber, code);

      this.logger.info({ phoneNumber }, 'Verification code sent successfully');

      // EXPOSE_SMS_CODE=true 환경에서만 code 반환 (개발/로컬 테스트용)
      if (process.env.EXPOSE_SMS_CODE === 'true') {
        return { code, message: 'SMS sent successfully' };
      }
      return { message: 'SMS sent successfully' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        { error: errorMessage, phoneNumber },
        'Failed to send verification code',
      );
      throw error;
    }
  }

  /**
   * SMS 인증번호 검증
   *
   * 사용자가 입력한 인증번호를 검증하는 프로세스:
   * 1. 휴대폰 번호로 최신 인증번호 조회
   * 2. 유효기간 확인 (10분 이내)
   * 3. 입력된 코드와 일치도 확인
   * 4. 중복 사용 여부 확인 (isUsed 플래그)
   * 5. 모든 검증 통과 시 isUsed = true로 업데이트
   *
   * @param phoneNumber 휴대폰 번호
   * @param inputCode 사용자가 입력한 인증번호 (6자리)
   * @returns true 인증 성공, false 인증 실패 (이유: 존재하지 않음, 만료됨, 불일치, 중복사용)
   * @throws Error - 데이터베이스 쿼리 실패 시
   */
  async verifyAuthCode(
    phoneNumber: string,
    inputCode: string,
  ): Promise<boolean> {
    this.logger.info(
      { phoneNumber },
      'Starting verification code verification',
    );

    try {
      // Step 1: 휴대폰 번호로 최신 인증번호 레코드 조회
      // createdAt 기준 최신순 정렬 후 가장 최근 것 1개만 조회
      const authCode = await this.db
        .select()
        .from(authCodes)
        .where(eq(authCodes.phoneNumber, phoneNumber))
        .orderBy(desc(authCodes.createdAt))
        .limit(1);

      // 해당 휴대폰 번호로 발송된 인증번호 기록이 없으면 실패
      if (!authCode || authCode.length === 0) {
        this.logger.warn(
          { phoneNumber },
          'No auth code found for this phone number',
        );
        return false;
      }

      const record = authCode[0];

      // Step 2: 유효기간 확인 (expiresAt을 넘으면 실패)
      if (new Date() > record.expiresAt) {
        this.logger.warn({ phoneNumber }, 'Auth code has expired');
        return false;
      }

      // Step 3 & 4: 입력 코드와 저장된 코드 비교 & 중복 사용 여부 확인
      // 다음 중 하나라도 맞지 않으면 실패:
      // - record.code !== inputCode (코드 값 불일치)
      // - record.isUsed === true (이미 사용된 인증번호)
      if (record.code !== inputCode || record.isUsed) {
        this.logger.warn({ phoneNumber }, 'Invalid or already used auth code');
        return false;
      }

      // Step 5: 모든 검증 통과 → isUsed를 true로 변경하여 중복 사용 방지
      await this.db
        .update(authCodes)
        .set({ isUsed: true })
        .where(eq(authCodes.id, record.id));

      this.logger.info(
        { phoneNumber },
        'Verification code verified successfully',
      );

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        { error: errorMessage, phoneNumber },
        'Failed to verify auth code',
      );
      throw error;
    }
  }

  /**
   * 로그인 (SMS 인증 후)
   *
   * SMS 인증이 완료된 사용자에 대해 JWT 토큰을 발급합니다.
   * 로그인에 앞서 SMS 인증번호 검증을 완료해야 합니다.
   *
   * 흐름:
   * 1. 휴대폰 번호로 사용자 조회
   * 2. 사용자가 존재하지 않으면 회원가입 유도
   * 3. 액세스 토큰 + 리프레시 토큰 생성
   * 4. 토큰 반환
   *
   * @param phoneNumber 휴대폰 번호
   * @returns { accessToken, refreshToken, expiresIn }
   * @throws UnauthorizedException - 사용자를 찾을 수 없음
   */
  async login(phoneNumber: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    this.logger.info({ phoneNumber }, '로그인 프로세스 시작');

    try {
      // Step 1: 휴대폰 번호로 사용자 조회
      const user = await this.db
        .select({
          id: users.id,
          role: users.role,
        })
        .from(users)
        .where(eq(users.phoneNumber, phoneNumber))
        .limit(1);

      if (user.length === 0) {
        this.logger.warn(
          { phoneNumber },
          '해당 휴대폰 번호의 사용자를 찾을 수 없음 - 회원가입 필요',
        );
        throw new UnauthorizedException(
          '등록되지 않은 휴대폰 번호입니다. 회원가입을 먼저 진행해주세요.',
        );
      }

      const userId = user[0].id;
      const userRole = user[0].role;

      // Step 2: 워커 프로필 ID 조회 (WORKER 역할만)
      let workerProfileId: string | undefined;
      if (userRole === 'WORKER') {
        const profile = await this.db
          .select({ id: workerProfiles.id })
          .from(workerProfiles)
          .where(eq(workerProfiles.userId, userId))
          .limit(1);

        if (profile.length === 0) {
          this.logger.error(
            { userId },
            'WORKER 역할인데 워커 프로필을 찾을 수 없음',
          );
          throw new BadRequestException(
            '워커 프로필 정보가 없습니다. 관리자에게 문의해주세요.',
          );
        }

        workerProfileId = profile[0].id;
      }

      // Step 3: JWT 토큰 생성 (TokenService 사용)
      // 참고: 휴대폰 기반 로그인은 email 필드에 phoneNumber를 사용, provider는 'local'
      const tokens = await this.tokenService.generateTokens(
        userId,
        phoneNumber,
        userRole,
        'local',
        workerProfileId,
      );

      this.logger.info({ userId, role: userRole }, '로그인 완료 - 토큰 발급');

      return tokens;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        { phoneNumber, error: errorMessage },
        '로그인 프로세스 실패',
      );
      throw new UnauthorizedException('로그인에 실패했습니다');
    }
  }

  /**
   * 이메일 회원가입
   *
   * 이메일 + 비밀번호로 INACTIVE 계정을 생성하고 이메일 인증 코드를 발송합니다.
   *
   * 프로세스:
   * 1. 이메일 중복 확인 (409 Conflict)
   * 2. bcrypt로 비밀번호 해시
   * 3. users 테이블에 INACTIVE 상태로 저장
   * 4. 이메일 인증 코드 발송 (EmailVerificationService)
   *
   * @param dto 회원가입 DTO (email, password, realName, agreeTerms)
   * @returns 회원가입 결과 (message, email, 개발 환경에서는 code 포함)
   * @throws ConflictException 이미 사용 중인 이메일
   */
  async emailSignup(
    dto: EmailSignupDto,
  ): Promise<{ message: string; email: string; code?: string }> {
    const { email, password, realName, agreeTerms } = dto;

    this.logger.info({ email }, '이메일 회원가입 시작');

    // 이메일 중복 확인: ACTIVE 계정은 가입 불가, INACTIVE 계정은 덮어쓰기 허용
    // INACTIVE 계정이 남아있는 경우: 이전 가입 시도에서 코드 미인증 상태
    const existingUser = await this.db
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].status !== 'INACTIVE') {
      this.logger.warn({ email }, '이미 가입된 이메일');
      throw new ConflictException('이미 사용 중인 이메일 주소입니다');
    }

    // bcrypt로 비밀번호 해시 (saltRounds: 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 이메일 인증 코드 발송 먼저 시도
    // 발송 실패 시 DB INSERT/UPDATE 자체를 건너뛰어 고아 레코드 생성을 방지
    const { code } = await this.emailVerificationService.sendVerificationCode(
      email,
      'SIGNUP',
    );

    // 발송 성공 후 users 테이블에 INACTIVE 상태로 저장
    // INACTIVE 계정이 이미 있으면 새 정보로 업데이트(재시도), 없으면 신규 INSERT
    const now = new Date();
    if (existingUser.length > 0) {
      // 이전 미인증 시도 덮어쓰기: 비밀번호/이름/약관 동의 갱신
      await this.db
        .update(users)
        .set({
          password: hashedPassword,
          realName: realName || undefined,
          emailVerified: false,
          termsAgreedAt: agreeTerms ? now : undefined,
          termsVersion: agreeTerms ? '2026-04' : undefined,
          updatedAt: now,
        })
        .where(
          and(
            eq(users.email, email.toLowerCase()),
            eq(users.status, 'INACTIVE'),
          ),
        );
      this.logger.info({ email }, '기존 미인증 계정 갱신 완료');
    } else {
      await this.db.insert(users).values({
        email: email.toLowerCase(),
        password: hashedPassword,
        realName: realName || undefined,
        role: 'WORKER',
        status: 'INACTIVE',
        emailVerified: false,
        phoneVerified: false,
        provider: 'local',
        isVerified: false,
        termsAgreedAt: agreeTerms ? now : undefined,
        termsVersion: agreeTerms ? '2026-04' : undefined,
      });
    }

    this.logger.info({ email }, '이메일 회원가입 계정 생성 완료');

    // EXPOSE_EMAIL_CODE=true 환경에서는 code를 응답에 포함 (개발/로컬 테스트용)
    if (process.env.EXPOSE_EMAIL_CODE === 'true' && code) {
      return {
        message:
          '인증 이메일을 발송했습니다. 이메일을 확인하고 인증 코드를 입력하세요.',
        email,
        code,
      };
    }

    return {
      message:
        '인증 이메일을 발송했습니다. 이메일을 확인하고 인증 코드를 입력하세요.',
      email,
    };
  }

  /**
   * 미인증 INACTIVE 계정 정리 (Cron Job)
   *
   * 이메일 인증을 완료하지 않은 임시 계정(INACTIVE 상태)을 주기적으로 삭제합니다.
   * 가입 폼을 제출했지만 코드 인증을 하지 않은 경우 생성되는 고아 레코드를 정리합니다.
   * createdAt 기준 24시간 초과 INACTIVE 계정만 삭제합니다.
   *
   * 실행 주기: 매일 오전 3시
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupUnverifiedAccounts(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await this.db
        .delete(users)
        .where(and(eq(users.status, 'INACTIVE'), lt(users.createdAt, cutoff)))
        .returning({ id: users.id });

      if (result.length > 0) {
        this.logger.info(
          { count: result.length },
          '미인증 INACTIVE 계정 정리 완료',
        );
      }
    } catch (error) {
      this.logger.error(
        { error: (error as Error).message },
        '미인증 INACTIVE 계정 정리 실패',
      );
    }
  }

  /**
   * 이메일 인증 완료 및 계정 활성화
   *
   * 이메일 인증 코드를 검증하고 계정을 ACTIVE로 전환한 후 JWT 토큰을 발급합니다.
   *
   * 프로세스:
   * 1. EmailVerificationService로 코드 검증
   * 2. users 테이블: emailVerified=true, status=ACTIVE 업데이트
   * 3. TokenService로 JWT 토큰 발급 (자동 로그인)
   *
   * @param dto 이메일 인증 DTO (email, code, type)
   * @returns 사용자 정보 및 JWT 토큰
   * @throws UnauthorizedException 인증 코드 불일치 또는 만료
   */
  async verifyEmailAndActivate(dto: EmailVerificationDto): Promise<{
    user: {
      id: string;
      email: string;
      role: string;
      status: string;
      emailVerified: boolean;
    };
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    const { email, code, type } = dto;

    this.logger.info(
      { email, type },
      '이메일 인증 코드 검증 및 계정 활성화 시작',
    );

    // 인증 코드 검증
    await this.emailVerificationService.verifyEmailCode(email, code, type);

    // 사용자 조회
    const userRecords = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (userRecords.length === 0) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    const user = userRecords[0];

    // emailVerified=true, status=ACTIVE로 업데이트
    await this.db
      .update(users)
      .set({
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    this.logger.info(
      { email, userId: user.id },
      '이메일 인증 완료 - 계정 활성화',
    );

    // 워커 프로필 ID 조회 (존재하는 경우)
    let workerProfileId: string | undefined;
    if (user.role === 'WORKER') {
      const profile = await this.db
        .select({ id: workerProfiles.id })
        .from(workerProfiles)
        .where(eq(workerProfiles.userId, user.id))
        .limit(1);

      if (profile.length > 0) {
        workerProfileId = profile[0].id;
      }
    }

    // JWT 토큰 발급 (자동 로그인)
    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      user.role,
      user.provider || 'local',
      workerProfileId,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: 'ACTIVE',
        emailVerified: true,
      },
      tokens,
    };
  }

  /**
   * 이메일 인증 코드 재발송
   *
   * 사용자가 인증 코드를 받지 못했거나 만료된 경우 재발송합니다.
   *
   * @param email 대상 이메일
   * @param type 인증 타입 (SIGNUP | PASSWORD_RESET | EMAIL_CHANGE)
   * @returns 재발송 결과 메시지
   * @throws BadRequestException 이미 인증된 이메일 또는 사용자 없음
   */
  async resendVerificationEmail(
    email: string,
    type: string,
  ): Promise<{ message: string }> {
    this.logger.info({ email, type }, '이메일 인증 코드 재발송 요청');

    // 사용자 확인
    const userRecords = await this.db
      .select({ id: users.id, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (userRecords.length === 0) {
      throw new BadRequestException('등록되지 않은 이메일 주소입니다');
    }

    const user = userRecords[0];

    // 이미 인증된 경우 재발송 거부
    if (user.emailVerified) {
      throw new BadRequestException('이미 이메일 인증이 완료된 계정입니다');
    }

    // 인증 코드 재발송
    await this.emailVerificationService.sendVerificationCode(
      email,
      type as 'SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_CHANGE',
    );

    this.logger.info({ email }, '이메일 인증 코드 재발송 완료');

    return { message: '인증 이메일을 재발송했습니다' };
  }

  /**
   * JWT 검증용 사용자 정보 조회
   *
   * JWT Strategy에서 호출되는 메서드입니다.
   * 토큰에 저장된 사용자 ID로 DB에서 사용자를 확인합니다.
   *
   * 사용 목적:
   * - 토큰 발급 후 사용자가 삭제된 경우 검증
   * - 사용자의 최신 정보 확인 (역할 변경 등)
   *
   * @param userId 사용자 ID (JWT의 sub claim)
   * @returns 사용자 객체 또는 null
   */
  async validateUser(userId: string): Promise<any | null> {
    this.logger.debug({ userId }, 'JWT 검증용 사용자 조회');

    try {
      const user = await this.db
        .select({
          id: users.id,
          phoneNumber: users.phoneNumber,
          role: users.role,
          isVerified: users.isVerified,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        this.logger.warn({ userId }, '사용자를 찾을 수 없음 (삭제됨)');
        return null;
      }

      // 워커 프로필 ID 추가 조회
      let workerProfileId: string | undefined;
      if (user[0].role === 'WORKER') {
        const profile = await this.db
          .select({ id: workerProfiles.id })
          .from(workerProfiles)
          .where(eq(workerProfiles.userId, userId))
          .limit(1);

        if (profile.length > 0) {
          workerProfileId = profile[0].id;
        }
      }

      return {
        id: user[0].id,
        phoneNumber: user[0].phoneNumber,
        role: user[0].role,
        isVerified: user[0].isVerified,
        workerProfileId,
      };
    } catch (error) {
      this.logger.error(
        { userId, error: (error as Error).message },
        'JWT 검증 중 에러',
      );
      return null;
    }
  }
}
