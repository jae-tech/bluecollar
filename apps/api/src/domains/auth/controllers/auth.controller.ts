import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { CreateWorkerDto, CreateWorkerSchema } from '../dtos/create-worker.dto';
import {
  SendVerificationCodeDto,
  SendVerificationCodeSchema,
} from '../dtos/send-verification-code.dto';
import { VerifyCodeDto, VerifyCodeSchema } from '../dtos/verify-code.dto';
import { LoginDto, LoginResponseDto, EmailLoginDto } from '../dtos/login.dto';
import { EmailSignupDto } from '../dtos/email-signup.dto';
import { EmailVerificationDto } from '../dtos/email-verification.dto';
import {
  RefreshTokenDto,
  RefreshTokenSchema,
  RefreshTokenResponseDto,
  LogoutDto,
  LogoutSchema,
} from '../dtos/refresh-token.dto';
import { PinoLogger } from 'nestjs-pino';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import type { UserPayload } from '@/common/types/user.types';
import { FastifyRequest } from 'fastify';

/**
 * Auth Controller
 *
 * 인증 관련 REST API 엔드포인트:
 * - POST /auth/workers/register: 워커 회원가입
 * - POST /auth/send-verification-code: SMS 인증번호 발송
 * - POST /auth/verify-code: SMS 인증번호 검증
 *
 * 모든 요청은 Zod를 통해 자동 검증되며, 검증 실패 시 400 Bad Request 반환
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly logger: PinoLogger,
  ) {
    // Logger가 제대로 주입되었으면 context 설정
    // (Test 환경에서 logger가 없을 수도 있으므로 safe check)
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(AuthController.name);
    }
  }

  /**
   * 워커 회원가입 엔드포인트
   *
   * 새로운 블루칼라 전문가 계정을 생성합니다.
   * 다음 정보를 필수로 요구:
   * - phoneNumber: 휴대폰 번호 (중복 불가)
   * - slug: 프로필 URL (중복 불가)
   * - businessName: 사업명
   *
   * Response:
   * - 201 Created: 회원가입 성공
   * - 409 Conflict: 휴대폰 번호 또는 slug 중복
   * - 400 Bad Request: DTO 검증 실패
   */
  @Public()
  @Post('workers/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '워커 회원가입',
    description: '새로운 블루칼라 전문가 계정을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    schema: {
      example: {
        id: 'uuid-string',
        phoneNumber: '01012345678',
        role: 'WORKER',
        workerProfile: {
          id: 'uuid-string',
          slug: 'expert-name',
          businessName: '전문가 사업명',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: '중복 데이터: 휴대폰 번호 또는 slug가 이미 존재',
  })
  @ApiBadRequestResponse({
    description: 'DTO 검증 실패',
  })
  async registerWorker(
    @Body(new ZodValidationPipe(CreateWorkerSchema))
    createWorkerDto: CreateWorkerDto,
  ) {
    // 요청 로깅 (디버깅 및 감시 목적)
    this.logger.info(
      { phoneNumber: createWorkerDto.phoneNumber },
      'Worker registration request received',
    );

    // AuthService의 registerWorker 메서드에 위임
    // Transaction 내에서 일관성 있게 처리됨
    return await this.authService.registerWorker(createWorkerDto);
  }

  /**
   * SMS 인증번호 발송 엔드포인트
   *
   * 사용자 휴대폰 번호로 6자리 인증번호를 SMS로 발송합니다.
   * 인증번호는 10분간 유효합니다.
   *
   * Response:
   * - 200 OK: 발송 성공 (code 포함 - 개발/테스트 용)
   * - 400 Bad Request: DTO 검증 실패
   */
  @Public()
  @Post('send-verification-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '인증번호 발송',
    description: '휴대폰 번호로 6자리 인증번호를 SMS로 발송합니다.',
  })
  @ApiOkResponse({
    description: '인증번호 발송 성공',
    schema: {
      example: {
        code: '123456',
        message: 'SMS sent successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'DTO 검증 실패',
  })
  async sendVerificationCode(
    @Body(new ZodValidationPipe(SendVerificationCodeSchema))
    dto: SendVerificationCodeDto,
  ) {
    // 요청 로깅
    this.logger.info(
      { phoneNumber: dto.phoneNumber },
      'Verification code request received',
    );

    // AuthService의 sendVerificationCode 메서드에 위임
    // 내부적으로 코드 생성 → DB 저장 → SMS 발송 수행
    return await this.authService.sendVerificationCode(dto.phoneNumber);
  }

  /**
   * SMS 인증번호 검증 엔드포인트
   *
   * 사용자가 입력한 인증번호를 검증합니다.
   * 검증 성공 시 해당 인증번호를 사용 완료(isUsed = true) 처리하여
   * 중복 사용을 방지합니다.
   *
   * Response:
   * - 200 OK: 검증 완료 (verified: boolean)
   * - 400 Bad Request: DTO 검증 실패
   */
  @Public()
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '인증번호 검증',
    description: '사용자가 입력한 인증번호를 검증합니다.',
  })
  @ApiOkResponse({
    description: '인증번호 검증 성공',
    schema: {
      example: {
        verified: true,
        message: 'Verification successful',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'DTO 검증 실패 또는 인증번호 검증 실패',
  })
  async verifyCode(
    @Body(new ZodValidationPipe(VerifyCodeSchema))
    dto: VerifyCodeDto,
  ) {
    // 요청 로깅
    this.logger.info(
      { phoneNumber: dto.phoneNumber },
      'Verification code verification request received',
    );

    // AuthService의 verifyAuthCode 메서드에 위임
    // 내부적으로 DB 조회 → 유효성 검증 → 사용 완료 표시 수행
    const verified = await this.authService.verifyAuthCode(
      dto.phoneNumber,
      dto.code,
    );

    // 검증 결과에 따라 다른 응답 반환
    if (!verified) {
      this.logger.warn(
        { phoneNumber: dto.phoneNumber },
        'Verification code verification failed',
      );
      return {
        verified: false,
        message: 'Invalid or expired verification code',
      };
    }

    return {
      verified: true,
      message: 'Verification code verified successfully',
    };
  }

  // 📧 Old phone-based login removed - email-based login implemented below

  /**
   * 토큰 갱신 엔드포인트
   *
   * 만료된 액세스 토큰을 갱신합니다.
   * 리프레시 토큰이 유효한 동안 새로운 액세스 토큰을 얻을 수 있습니다.
   *
   * Response:
   * - 200 OK: 갱신 성공, 새로운 accessToken 반환
   * - 401 Unauthorized: 유효하지 않거나 만료된 리프레시 토큰
   * - 400 Bad Request: DTO 검증 실패
   *
   * @returns { accessToken, expiresIn, tokenType }
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '토큰 갱신',
    description:
      '리프레시 토큰으로 새로운 액세스 토큰을 발급받습니다. 액세스 토큰이 만료되었을 때 사용합니다.',
  })
  @ApiOkResponse({
    description: '토큰 갱신 성공',
    type: RefreshTokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '유효하지 않거나 만료된 리프레시 토큰',
  })
  @ApiBadRequestResponse({
    description: 'DTO 검증 실패',
  })
  async refreshToken(
    @Body(new ZodValidationPipe(RefreshTokenSchema))
    dto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    this.logger.info(
      { refreshToken: dto.refreshToken.substring(0, 8) },
      '토큰 갱신 요청 수신',
    );

    const accessToken = await this.tokenService.refreshAccessToken(
      dto.refreshToken,
    );

    return {
      accessToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  }

  /**
   * 로그아웃 엔드포인트
   *
   * 리프레시 토큰을 폐기하여 더 이상 사용할 수 없도록 합니다.
   * 로그아웃 후 다른 기기에서도 재로그인이 필요합니다.
   *
   * Response:
   * - 200 OK: 로그아웃 성공
   * - 400 Bad Request: DTO 검증 실패
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그아웃',
    description: '리프레시 토큰을 폐기하여 세션을 종료합니다.',
  })
  @ApiOkResponse({
    description: '로그아웃 성공',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'DTO 검증 실패',
  })
  async logout(
    @Body(new ZodValidationPipe(LogoutSchema)) dto: LogoutDto,
  ): Promise<{ message: string }> {
    this.logger.info(
      { refreshToken: dto.refreshToken.substring(0, 8) },
      '로그아웃 요청 수신',
    );

    await this.tokenService.revokeRefreshToken(dto.refreshToken);

    return {
      message: 'Logged out successfully',
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // 📧 EMAIL-BASED AUTHENTICATION ENDPOINTS (NEW)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 📧 이메일 기반 로그인
   *
   * Local Strategy (email + password)를 사용합니다.
   * - 비밀번호는 bcrypt로 검증
   * - INACTIVE 계정 로그인 차단
   * - Rate Limiting: 동일 IP당 5회/분
   *
   * 응답:
   * - 200 OK: 로그인 성공 (accessToken, refreshToken)
   * - 401 Unauthorized: 이메일 또는 비밀번호 불일치
   * - 403 Forbidden: INACTIVE 계정
   */
  @ApiOperation({
    summary: '📧 이메일 + 비밀번호 로그인',
    description: '로컬 계정으로 로그인합니다. Local Strategy 사용.',
  })
  @ApiOkResponse({
    description: '로그인 성공',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '이메일 또는 비밀번호 불일치',
  })
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 🔒 60초에 5회 제한
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard, AuthGuard('local'))
  async login(@Req() req: FastifyRequest): Promise<LoginResponseDto> {
    const user = req.user!;

    this.logger.info({ userId: user.id, email: user.email }, '✓ 로그인 성공');

    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      user.role,
      user.provider,
      user.workerProfileId,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
    };
  }

  /**
   * 🔵 Google OAuth 로그인 시작
   *
   * Google OAuth2 인증 페이지로 리다이렉트합니다.
   * Passport Google Strategy 사용
   */
  @ApiOperation({
    summary: '🔵 Google 로그인 (OAuth2)',
    description: 'Google OAuth2 인증 페이지로 리다이렉트합니다.',
  })
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 🔒 60초에 10회 제한
  @Get('login/google')
  @UseGuards(ThrottlerGuard, AuthGuard('google'))
  async loginWithGoogle(): Promise<void> {
    // Passport가 Google 인증 페이지로 자동 리다이렉트
  }

  /**
   * 🔵 Google OAuth 콜백
   *
   * Google 승인 후 콜백 URL입니다.
   * 자동으로 토큰을 발급하고 클라이언트로 리다이렉트합니다.
   */
  @ApiOperation({
    summary: '🔵 Google 로그인 콜백',
    description: 'Google OAuth2 콜백 처리',
  })
  @Public()
  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: FastifyRequest,
    @Res() res: any,
  ): Promise<void> {
    const user = req.user!;

    this.logger.info(
      { userId: user.id, email: user.email, provider: 'google' },
      '✓ Google OAuth 인증 성공',
    );

    // 토큰 발급
    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      user.role,
      'google',
      user.workerProfileId,
    );

    // 토큰을 httpOnly 쿠키로 설정 (URL 노출 방지)
    const isProduction = process.env.NODE_ENV === 'production';
    res.setCookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 900, // 15분
      path: '/',
    });
    res.setCookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30일
      path: '/',
    });

    // 클라이언트로 리다이렉트 (토큰 없이)
    const redirectUrl = user.phoneVerified
      ? `${process.env.APP_URL || 'http://localhost:3000'}/auth/success`
      : `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify-phone`;

    res.redirect(redirectUrl);
  }

  /**
   * 🟨 Kakao OAuth 로그인 시작
   *
   * Kakao OAuth2 인증 페이지로 리다이렉트합니다.
   * Passport Kakao Strategy 사용
   */
  @ApiOperation({
    summary: '🟨 Kakao 로그인 (OAuth2)',
    description: 'Kakao OAuth2 인증 페이지로 리다이렉트합니다.',
  })
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 🔒 60초에 10회 제한
  @Get('login/kakao')
  @UseGuards(ThrottlerGuard, AuthGuard('kakao'))
  async loginWithKakao(): Promise<void> {
    // Passport가 Kakao 인증 페이지로 자동 리다이렉트
  }

  /**
   * 🟨 Kakao OAuth 콜백
   */
  @ApiOperation({
    summary: '🟨 Kakao 로그인 콜백',
    description: 'Kakao OAuth2 콜백 처리',
  })
  @Public()
  @Get('callback/kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(
    @Req() req: FastifyRequest,
    @Res() res: any,
  ): Promise<void> {
    const user = req.user!;

    this.logger.info(
      { userId: user.id, email: user.email, provider: 'kakao' },
      '✓ Kakao OAuth 인증 성공',
    );

    // 토큰 발급
    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      user.role,
      'kakao',
      user.workerProfileId,
    );

    // 토큰을 httpOnly 쿠키로 설정 (URL 노출 방지)
    const isProduction = process.env.NODE_ENV === 'production';
    res.setCookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 900,
      path: '/',
    });
    res.setCookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    // 클라이언트로 리다이렉트 (토큰 없이)
    const redirectUrl = user.phoneVerified
      ? `${process.env.APP_URL || 'http://localhost:3000'}/auth/success`
      : `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify-phone`;

    res.redirect(redirectUrl);
  }
}
