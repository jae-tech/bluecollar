import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PinoLogger } from 'nestjs-pino';

/**
 * AuthController Unit Tests
 *
 * AuthController의 REST API 엔드포인트 테스트:
 * - registerWorker: POST /auth/workers/register
 * - sendVerificationCode: POST /auth/send-verification-code
 * - verifyCode: POST /auth/verify-code
 *
 * 테스트 범위:
 * - 올바른 요청 처리
 * - 서비스 메서드 호출 확인
 * - 응답 형식 검증
 */
describe('AuthController', () => {
  let authController: AuthController;

  // Mock objects
  let mockAuthService: any;
  let mockTokenService: any;
  let mockLogger: any;

  beforeEach(() => {
    // Mock AuthService
    mockAuthService = {
      registerWorker: vi.fn(),
      sendVerificationCode: vi.fn(),
      verifyAuthCode: vi.fn(),
    };

    // Mock TokenService
    mockTokenService = {
      generateTokens: vi.fn(),
      refreshTokens: vi.fn(),
      revokeToken: vi.fn(),
    };

    // Mock Logger
    mockLogger = {
      setContext: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Create AuthController instance with mocks
    authController = new AuthController(
      mockAuthService,
      mockTokenService,
      mockLogger,
    );
  });

  describe('registerWorker', () => {
    it('should call authService.registerWorker and return the result', async () => {
      // Arrange: 워커 회원가입 요청
      const createWorkerDto = {
        phoneNumber: '01012345678',
        businessName: '김타일공사',
        slug: 'kim-tile',
        fieldCodes: ['FLD_TILE'],
        areaCodes: ['AREA_SEOUL_GN'],
        realName: '김철수',
        email: 'kim@example.com',
      };

      const expectedResult = {
        id: 'user-123',
        phoneNumber: createWorkerDto.phoneNumber,
        role: 'WORKER',
        workerProfile: {
          id: 'profile-123',
          slug: createWorkerDto.slug,
          businessName: createWorkerDto.businessName,
        },
      };

      mockAuthService.registerWorker.mockResolvedValue(expectedResult);

      // Act: registerWorker 컨트롤러 메서드 호출
      const result = await authController.registerWorker(createWorkerDto);

      // Assert: 서비스 메서드가 올바르게 호출되고 결과가 반환되는지 확인
      expect(mockAuthService.registerWorker).toHaveBeenCalledWith(
        createWorkerDto,
      );
      expect(result).toEqual(expectedResult);

      // 로깅 확인
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should pass exact data to authService without modification', async () => {
      // Arrange: 정확한 데이터 전달 테스트
      const createWorkerDto = {
        phoneNumber: '01099999999',
        businessName: '박다중전문가',
        slug: 'park-multi-field',
        fieldCodes: ['FLD_TILE', 'FLD_PAINTING', 'FLD_PLUMBING'],
        areaCodes: ['AREA_SEOUL_GN', 'AREA_SEOUL_SC'],
      };

      mockAuthService.registerWorker.mockResolvedValue({
        id: 'user-id',
        phoneNumber: createWorkerDto.phoneNumber,
      });

      // Act
      await authController.registerWorker(createWorkerDto);

      // Assert: 정확히 같은 객체가 전달되었는지 확인
      expect(mockAuthService.registerWorker).toHaveBeenCalledWith(
        createWorkerDto,
      );
      expect(mockAuthService.registerWorker).toHaveBeenCalledTimes(1);
    });

    it('should log the phoneNumber when request is received', async () => {
      // Arrange
      const createWorkerDto = {
        phoneNumber: '01012345678',
        businessName: '테스트',
        slug: 'test-slug',
        fieldCodes: ['FLD_TILE'],
        areaCodes: ['AREA_SEOUL_GN'],
      };

      mockAuthService.registerWorker.mockResolvedValue({});

      // Act
      await authController.registerWorker(createWorkerDto);

      // Assert: 로그에 phoneNumber가 포함되어 있는지 확인
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: createWorkerDto.phoneNumber,
        }),
        expect.any(String),
      );
    });
  });

  describe('sendVerificationCode', () => {
    it('should call authService.sendVerificationCode with phoneNumber', async () => {
      // Arrange: SMS 인증번호 발송 요청
      const dto = {
        phoneNumber: '01012345678',
      };

      const expectedResult = {
        code: '123456',
      };

      mockAuthService.sendVerificationCode.mockResolvedValue(expectedResult);

      // Act
      const result = await authController.sendVerificationCode(dto);

      // Assert
      expect(mockAuthService.sendVerificationCode).toHaveBeenCalledWith(
        dto.phoneNumber,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should log phoneNumber when verification code request is received', async () => {
      // Arrange
      const dto = {
        phoneNumber: '01012345678',
      };

      mockAuthService.sendVerificationCode.mockResolvedValue({
        code: '123456',
      });

      // Act
      await authController.sendVerificationCode(dto);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: dto.phoneNumber,
        }),
        expect.any(String),
      );
    });

    it('should handle different phone numbers correctly', async () => {
      // Arrange: 다양한 휴대폰 번호 테스트
      const phoneNumbers = ['01012345678', '01098765432', '010-1234-5678'];

      mockAuthService.sendVerificationCode.mockResolvedValue({
        code: '123456',
      });

      // Act & Assert
      for (const phoneNumber of phoneNumbers) {
        mockLogger.info.mockClear();
        const dto = { phoneNumber };

        await authController.sendVerificationCode(dto);

        expect(mockAuthService.sendVerificationCode).toHaveBeenCalledWith(
          phoneNumber,
        );
      }
    });
  });

  describe('verifyCode', () => {
    it('should call authService.verifyAuthCode with phoneNumber and code', async () => {
      // Arrange: 인증번호 검증 요청
      const dto = {
        phoneNumber: '01012345678',
        code: '123456',
      };

      mockAuthService.verifyAuthCode.mockResolvedValue(true);

      // Act
      const result = await authController.verifyCode(dto);

      // Assert
      expect(mockAuthService.verifyAuthCode).toHaveBeenCalledWith(
        dto.phoneNumber,
        dto.code,
      );
      expect(result.verified).toBe(true);
      expect(result.message).toBe('Verification code verified successfully');
    });

    it('should return success response when verification passes', async () => {
      // Arrange
      const dto = {
        phoneNumber: '01012345678',
        code: '123456',
      };

      mockAuthService.verifyAuthCode.mockResolvedValue(true);

      // Act
      const result = await authController.verifyCode(dto);

      // Assert: 성공 응답 형식 확인
      expect(result).toEqual({
        verified: true,
        message: 'Verification code verified successfully',
      });
    });

    it('should return failure response when verification fails', async () => {
      // Arrange: 검증 실패 시나리오
      const dto = {
        phoneNumber: '01012345678',
        code: '999999', // 잘못된 코드
      };

      mockAuthService.verifyAuthCode.mockResolvedValue(false);

      // Act
      const result = await authController.verifyCode(dto);

      // Assert: 실패 응답 형식 확인
      expect(result).toEqual({
        verified: false,
        message: 'Invalid or expired verification code',
      });
    });

    it('should log when verification fails', async () => {
      // Arrange
      const dto = {
        phoneNumber: '01012345678',
        code: '999999',
      };

      mockAuthService.verifyAuthCode.mockResolvedValue(false);

      // Act
      await authController.verifyCode(dto);

      // Assert: 실패 로그가 기록되었는지 확인
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: dto.phoneNumber,
        }),
        expect.any(String),
      );
    });

    it('should not log warning when verification succeeds', async () => {
      // Arrange
      const dto = {
        phoneNumber: '01012345678',
        code: '123456',
      };

      mockAuthService.verifyAuthCode.mockResolvedValue(true);
      mockLogger.warn.mockClear();

      // Act
      await authController.verifyCode(dto);

      // Assert
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should log phoneNumber when verification request is received', async () => {
      // Arrange
      const dto = {
        phoneNumber: '01012345678',
        code: '123456',
      };

      mockAuthService.verifyAuthCode.mockResolvedValue(true);

      // Act
      await authController.verifyCode(dto);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumber: dto.phoneNumber,
        }),
        expect.any(String),
      );
    });

    it('should handle code validation with exact match', async () => {
      // Arrange: 정확한 코드 매칭 테스트
      const correctCode = '123456';
      const dto = {
        phoneNumber: '01012345678',
        code: correctCode,
      };

      mockAuthService.verifyAuthCode.mockResolvedValue(true);

      // Act
      const result = await authController.verifyCode(dto);

      // Assert
      expect(mockAuthService.verifyAuthCode).toHaveBeenCalledWith(
        dto.phoneNumber,
        correctCode,
      );
      expect(result.verified).toBe(true);
    });
  });

  describe('Integration: Multiple operations', () => {
    it('should handle sequence of verification operations', async () => {
      // Arrange: 일련의 작업 시나리오
      const phoneNumber = '01012345678';

      // 1. 인증번호 발송
      mockAuthService.sendVerificationCode.mockResolvedValue({
        code: '123456',
      });

      // 2. 잘못된 코드로 검증 시도
      mockAuthService.verifyAuthCode
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true); // 정확한 코드로 재시도

      // Act & Assert
      // 1. 발송
      const sendResult = await authController.sendVerificationCode({
        phoneNumber,
      });
      expect(sendResult.code).toBe('123456');

      // 2. 잘못된 코드 검증
      mockLogger.warn.mockClear();
      const wrongCodeResult = await authController.verifyCode({
        phoneNumber,
        code: '999999',
      });
      expect(wrongCodeResult.verified).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalled();

      // 3. 올바른 코드 검증
      mockLogger.warn.mockClear();
      const correctCodeResult = await authController.verifyCode({
        phoneNumber,
        code: '123456',
      });
      expect(correctCodeResult.verified).toBe(true);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });
});
