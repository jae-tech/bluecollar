import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PinoLogger } from 'nestjs-pino';

/**
 * AuthService Unit Tests
 *
 * AuthService의 주요 메서드들을 테스트:
 * - registerWorker: 워커 회원가입 (트랜잭션)
 * - sendVerificationCode: SMS 인증번호 발송
 * - verifyAuthCode: SMS 인증번호 검증
 *
 * Mock 사용:
 * - Drizzle DB (PostgresJsDatabase)
 * - SmsService
 * - PinoLogger
 */
describe('AuthService', () => {
  let authService: AuthService;

  // Mock objects
  let mockDb: any;
  let mockLogger: any;
  let mockSmsService: any;

  beforeEach(() => {
    // Mock Drizzle Database
    mockDb = {
      transaction: vi.fn(),
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
    };

    // Mock Logger
    mockLogger = {
      setContext: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Mock SMS Service
    mockSmsService = {
      sendVerificationCode: vi.fn().mockResolvedValue(undefined),
    };

    // Create AuthService instance with mocks
    authService = new AuthService(mockDb, mockLogger, mockSmsService);
  });

  describe('registerWorker', () => {
    // Mock 트랜잭션 실행 헬퍼
    const mockTransactionExecution = (fn: (tx: any) => Promise<any>) => {
      return fn({
        select: vi.fn(),
        insert: vi.fn(),
      });
    };

    it('should successfully register a worker with all fields', async () => {
      // Arrange: 성공적인 회원가입 시나리오 설정
      const createWorkerDto = {
        phoneNumber: '01012345678',
        businessName: '김타일공사',
        slug: 'kim-tile',
        fieldCodes: ['FLD_TILE', 'FLD_PAINTING'],
        areaCodes: ['AREA_SEOUL_GN'],
        realName: '김철수',
        email: 'kim@example.com',
      };

      const mockUser = {
        id: 'user-123',
        phoneNumber: createWorkerDto.phoneNumber,
        email: createWorkerDto.email,
        realName: createWorkerDto.realName,
        role: 'WORKER',
        isVerified: false,
      };

      const mockWorkerProfile = {
        id: 'profile-123',
        userId: mockUser.id,
        slug: createWorkerDto.slug,
        businessName: createWorkerDto.businessName,
      };

      // Mock transaction 구성
      mockDb.transaction.mockImplementation((fn) => {
        const mockTx = {
          select: vi.fn(),
          insert: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([mockUser]),
        };

        // 첫 번째 insert(users)는 newUser 반환
        // 두 번째 insert(workerProfiles)는 newWorkerProfile 반환
        mockTx.insert = vi
          .fn()
          .mockReturnValueOnce({
            values: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValueOnce([mockUser]),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValueOnce([mockWorkerProfile]),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockResolvedValue(undefined),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockResolvedValue(undefined),
          });

        // 중복 체크용 select
        mockTx.select = vi
          .fn()
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValueOnce([]), // phoneNumber 없음
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValueOnce([]), // slug 없음
          });

        return fn(mockTx);
      });

      // Act: registerWorker 실행
      const result = await authService.registerWorker(createWorkerDto);

      // Assert: 결과 검증
      expect(result).toEqual({
        id: mockUser.id,
        phoneNumber: createWorkerDto.phoneNumber,
        role: 'WORKER',
        workerProfile: {
          id: mockWorkerProfile.id,
          slug: createWorkerDto.slug,
          businessName: createWorkerDto.businessName,
        },
      });

      // Mock이 올바르게 호출되었는지 확인
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should throw ConflictException when phoneNumber already exists', async () => {
      // Arrange: 휴대폰 번호 중복 시나리오
      const createWorkerDto = {
        phoneNumber: '01012345678',
        businessName: '김타일공사',
        slug: 'kim-tile',
        fieldCodes: ['FLD_TILE'],
        areaCodes: ['AREA_SEOUL_GN'],
      };

      const existingUser = {
        id: 'existing-user',
        phoneNumber: createWorkerDto.phoneNumber,
      };

      mockDb.transaction.mockImplementation((fn) => {
        const mockTx = {
          select: vi.fn().mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValueOnce([existingUser]), // 중복됨
          }),
        };

        return fn(mockTx);
      });

      // Act & Assert: ConflictException 발생 확인
      await expect(authService.registerWorker(createWorkerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when slug already exists', async () => {
      // Arrange: slug 중복 시나리오
      const createWorkerDto = {
        phoneNumber: '01012345678',
        businessName: '김타일공사',
        slug: 'kim-tile',
        fieldCodes: ['FLD_TILE'],
        areaCodes: ['AREA_SEOUL_GN'],
      };

      const existingProfile = { id: 'profile-id', slug: createWorkerDto.slug };

      mockDb.transaction.mockImplementation((fn) => {
        const mockTx = {
          select: vi
            .fn()
            .mockReturnValueOnce({
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValueOnce([]), // phoneNumber 없음
            })
            .mockReturnValueOnce({
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValueOnce([existingProfile]), // slug 중복
            }),
        };

        return fn(mockTx);
      });

      // Act & Assert
      await expect(authService.registerWorker(createWorkerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('sendVerificationCode', () => {
    it('should generate and save a 6-digit verification code', async () => {
      // Arrange: SMS 발송 시나리오
      const phoneNumber = '01012345678';

      mockDb.insert = vi.fn().mockReturnThis();
      mockDb.values = vi.fn().mockResolvedValue(undefined);

      // EXPOSE_SMS_CODE=true 설정 (테스트 환경에서 code 반환 활성화)
      process.env.EXPOSE_SMS_CODE = 'true';

      // Math.random 고정값 설정 (테스트 결과 일관성)
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.123456);

      // Act: sendVerificationCode 실행
      const result = await authService.sendVerificationCode(phoneNumber);

      // Assert: 결과는 { code: '123456' } 형식이어야 함
      expect(result).toHaveProperty('code');
      expect(typeof result.code).toBe('string');
      expect(result.code).toMatch(/^\d{6}$/); // 6자리 숫자

      // Mock 호출 확인
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockSmsService.sendVerificationCode).toHaveBeenCalledWith(
        phoneNumber,
        expect.stringMatching(/^\d{6}$/),
      );

      randomSpy.mockRestore();
      delete process.env.EXPOSE_SMS_CODE;
    });

    it('should set expiration time to 10 minutes from now', async () => {
      // Arrange
      const phoneNumber = '01012345678';
      const beforeTime = Date.now();

      let capturedExpiration: Date | undefined;

      mockDb.insert = vi.fn().mockReturnThis();
      mockDb.values = vi.fn().mockImplementation((values) => {
        capturedExpiration = values.expiresAt;
        return Promise.resolve(undefined);
      });

      // Act
      await authService.sendVerificationCode(phoneNumber);

      // Assert: 유효기한이 10분 정도 뒤인지 확인 (900,000ms = 10분)
      const afterTime = Date.now();
      const expectedMinExpiration = beforeTime + 9 * 60 * 1000; // 9분
      const expectedMaxExpiration = afterTime + 11 * 60 * 1000; // 11분

      expect(capturedExpiration?.getTime()).toBeGreaterThanOrEqual(
        expectedMinExpiration,
      );
      expect(capturedExpiration?.getTime()).toBeLessThanOrEqual(
        expectedMaxExpiration,
      );
    });

    it('should call SmsService with correct parameters', async () => {
      // Arrange
      const phoneNumber = '01012345678';

      mockDb.insert = vi.fn().mockReturnThis();
      mockDb.values = vi.fn().mockResolvedValue(undefined);

      // EXPOSE_SMS_CODE=true 설정 (테스트 환경에서 code 반환 활성화)
      process.env.EXPOSE_SMS_CODE = 'true';

      // Act
      const result = await authService.sendVerificationCode(phoneNumber);

      // Assert: SmsService가 올바른 인자로 호출되었는지 확인
      expect(mockSmsService.sendVerificationCode).toHaveBeenCalledWith(
        phoneNumber,
        result.code,
      );

      delete process.env.EXPOSE_SMS_CODE;
    });

    it('should throw error when database insert fails', async () => {
      // Arrange: DB 에러 시나리오
      const phoneNumber = '01012345678';
      const dbError = new Error('Database connection failed');

      mockDb.insert = vi.fn().mockReturnThis();
      mockDb.values = vi.fn().mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        authService.sendVerificationCode(phoneNumber),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('verifyAuthCode', () => {
    // Mock 헬퍼: DB 쿼리 결과 설정
    const mockAuthCodeRecord = {
      id: 'code-123',
      phoneNumber: '01012345678',
      code: '123456',
      isUsed: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10분 뒤
      createdAt: new Date(),
    };

    it('should return true when code is valid and not expired', async () => {
      // Arrange: 유효한 인증번호
      const phoneNumber = '01012345678';
      const inputCode = '123456';

      mockDb.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([mockAuthCodeRecord]),
      });

      mockDb.update = vi.fn().mockReturnThis();
      mockDb.set = vi.fn().mockReturnThis();
      mockDb.where = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await authService.verifyAuthCode(phoneNumber, inputCode);

      // Assert
      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should return false when no auth code found', async () => {
      // Arrange: 인증번호 없음
      const phoneNumber = '01012345678';
      const inputCode = '123456';

      mockDb.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]), // 빈 배열
      });

      // Act
      const result = await authService.verifyAuthCode(phoneNumber, inputCode);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when code has expired', async () => {
      // Arrange: 만료된 인증번호
      const phoneNumber = '01012345678';
      const inputCode = '123456';

      const expiredRecord = {
        ...mockAuthCodeRecord,
        expiresAt: new Date(Date.now() - 1 * 60 * 1000), // 1분 전 만료
      };

      mockDb.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([expiredRecord]),
      });

      // Act
      const result = await authService.verifyAuthCode(phoneNumber, inputCode);

      // Assert
      expect(result).toBe(false);
      // update를 호출하지 않아야 함 (만료된 코드는 업데이트하지 않음)
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should return false when code does not match', async () => {
      // Arrange: 코드 불일치
      const phoneNumber = '01012345678';
      const inputCode = '999999'; // 다른 코드

      mockDb.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([mockAuthCodeRecord]),
      });

      // Act
      const result = await authService.verifyAuthCode(phoneNumber, inputCode);

      // Assert
      expect(result).toBe(false);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should return false when code has already been used', async () => {
      // Arrange: 이미 사용된 코드
      const phoneNumber = '01012345678';
      const inputCode = '123456';

      const usedRecord = {
        ...mockAuthCodeRecord,
        isUsed: true,
      };

      mockDb.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([usedRecord]),
      });

      // Act
      const result = await authService.verifyAuthCode(phoneNumber, inputCode);

      // Assert
      expect(result).toBe(false);
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should update isUsed flag after successful verification', async () => {
      // Arrange
      const phoneNumber = '01012345678';
      const inputCode = '123456';

      mockDb.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([mockAuthCodeRecord]),
      });

      let updateCalledWith: any;
      mockDb.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation((fn) => {
            updateCalledWith = fn;
            return Promise.resolve(undefined);
          }),
        }),
      });

      // Act
      const result = await authService.verifyAuthCode(phoneNumber, inputCode);

      // Assert
      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw error when database query fails', async () => {
      // Arrange: DB 에러
      const phoneNumber = '01012345678';
      const inputCode = '123456';
      const dbError = new Error('Database query failed');

      mockDb.select = vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValueOnce(dbError),
      });

      // Act & Assert
      await expect(
        authService.verifyAuthCode(phoneNumber, inputCode),
      ).rejects.toThrow('Database query failed');
    });
  });
});
